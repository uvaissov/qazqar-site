import { beforeEach, expect, test, vi } from "vitest";
const m = vi.hoisted(() => ({
  userFind: vi.fn(), userCreate: vi.fn(), car: vi.fn(), booking: vi.fn(), bookingFind: vi.fn(),
  bookingUpdate: vi.fn(), txBookingFind: vi.fn(), session: vi.fn(), kick: vi.fn(), notify: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: {
  car: { findUnique: m.car },
  user: { findUnique: m.userFind, create: m.userCreate },
  booking: { findUnique: m.bookingFind, update: m.bookingUpdate },
  $transaction: async (run: (tx: unknown) => unknown) => run({
    $executeRaw: vi.fn(), booking: { findFirst: vi.fn().mockResolvedValue(null), findUnique: m.txBookingFind, create: m.booking },
  }),
} }));
vi.mock("@/lib/data/cars", () => ({ isCarPublic: () => true, BLOCKING_BOOKING_STATUSES: ["PENDING", "CONFIRMED", "ACTIVE", "RETURN_PENDING"] }));
vi.mock("@/lib/auth", () => ({ getSession: m.session, signAccessToken: vi.fn(), signRefreshToken: vi.fn(), setAuthCookies: vi.fn() }));
vi.mock("@/lib/otp", () => ({ verifyOtp: async () => true }));
vi.mock("bcryptjs", () => ({ hash: async () => "hash" }));
vi.mock("@/lib/yume/crm-queue", () => ({ kickCrmQueue: m.kick }));
vi.mock("@/lib/telegram/notify", () => ({ notifyNewBooking: m.notify, newBookingNotice: (b: unknown) => b }));
vi.mock("@/lib/pricing", () => ({ quote: async () => ({ pricePerDay: 20000, totalPrice: 40000, deposit: 30000, withoutDeposit: 5000 }), isQuoteError: () => false }));
import { POST } from "./route";

const body = (extra: Record<string, unknown> = {}) => JSON.stringify({
  carId: "car", customerName: "Медер Аматов", customerPhone: "+7 701 221 91 16", customerEmail: "meder.amatov@gmail.com",
  otpCode: "123456", startDate: "2030-10-02 10:00", endDate: "2030-10-04 10:00", ...extra,
});
const post = (extra?: Record<string, unknown>) => POST(new Request("http://localhost/api/bookings", { method: "POST", body: body(extra) }));

beforeEach(() => {
  vi.resetAllMocks();
  m.car.mockResolvedValue({ id: "car", inventoryId: 25, number: "461CQ01", model: { name: "Accent", brand: { name: "Hyundai" } } });
  m.userCreate.mockResolvedValue({ id: "user", clientId: null, email: "meder.amatov@gmail.com", phone: "+77012219116", firstName: "Медер", lastName: "Аматов", iin: null });
  m.userFind.mockResolvedValue(null);
  m.booking.mockImplementation(async ({ data }) => ({ id: "booking", ...data }));
  m.notify.mockResolvedValue({ ok: true, messageId: 777 });
});

test("заявка создаётся локально и ставится в очередь в Yume, ответ — без похода в CRM", async () => {
  const res = await post({ attribution: { source: "google", medium: "cpc" } });
  expect(res.status).toBe(200);
  expect(await res.json()).toMatchObject({ success: true, bookingId: "booking", newUser: true });
  expect(m.booking).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
    userId: "user", crmSyncStatus: "PENDING", crmSyncNextAt: expect.any(Date),
    crmComment: expect.stringContaining("Канал привлечения: google / cpc"),
  }) }));
  // message_id Telegram сохраняется и снимается пауза очереди — потом пинок воркеру
  expect(m.bookingUpdate).toHaveBeenCalledWith({ where: { id: "booking" }, data: { telegramMessageId: 777, crmSyncNextAt: null } });
  expect(m.kick).toHaveBeenCalled();
});

test("повтор с тем же ключом отдаёт ту же заявку и не проверяет OTP повторно", async () => {
  m.bookingFind.mockResolvedValue({ id: "booking", carId: "car" });
  const res = await post({ idempotencyKey: "0b9f6c1e-1d2a-4f7e-9a51-3c2b1a0f9e88" });
  expect(await res.json()).toEqual({ success: true, bookingId: "booking", newUser: false });
  expect(m.booking).not.toHaveBeenCalled();
  expect(m.kick).not.toHaveBeenCalled();
});

test("параллельный дубль, дождавшийся блокировки, получает созданную заявку", async () => {
  m.bookingFind.mockResolvedValue(null);
  m.txBookingFind.mockResolvedValue({ id: "booking", carId: "car" });
  const res = await post({ idempotencyKey: "0b9f6c1e-1d2a-4f7e-9a51-3c2b1a0f9e88" });
  expect(await res.json()).toEqual({ success: true, bookingId: "booking", newUser: false });
  expect(m.booking).not.toHaveBeenCalled();
});

test("тот же ключ на другую машину — 409", async () => {
  m.bookingFind.mockResolvedValue({ id: "booking", carId: "other-car" });
  const res = await post({ idempotencyKey: "0b9f6c1e-1d2a-4f7e-9a51-3c2b1a0f9e88" });
  expect(res.status).toBe(409);
  expect(await res.json()).toEqual({ error: "IDEMPOTENCY_KEY_REUSED" });
});

test("кривой ключ — 400", async () => {
  const res = await post({ idempotencyKey: "a b" });
  expect(res.status).toBe(400);
  expect(await res.json()).toEqual({ error: "INVALID_IDEMPOTENCY_KEY" });
});
