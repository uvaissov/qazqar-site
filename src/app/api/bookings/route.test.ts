import { beforeEach, expect, test, vi } from "vitest";
const m = vi.hoisted(() => ({
  userFind: vi.fn(), userCreate: vi.fn(), userUpdate: vi.fn(), car: vi.fn(),
  booking: vi.fn(), resolve: vi.fn(), crm: vi.fn(), session: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: {
  car: { findUnique: m.car },
  user: { findUnique: m.userFind, create: m.userCreate, updateMany: m.userUpdate },
  $transaction: async (run: (tx: unknown) => unknown) => run({
    $executeRaw: vi.fn(), booking: { findFirst: vi.fn().mockResolvedValue(null), create: m.booking },
  }),
} }));
vi.mock("@/lib/data/cars", () => ({ isCarPublic: () => true, BLOCKING_BOOKING_STATUSES: ["PENDING", "CONFIRMED", "ACTIVE", "RETURN_PENDING"] }));
vi.mock("@/lib/auth", () => ({ getSession: m.session, signAccessToken: vi.fn(), signRefreshToken: vi.fn(), setAuthCookies: vi.fn() }));
vi.mock("@/lib/otp", () => ({ verifyOtp: async () => true }));
vi.mock("bcryptjs", () => ({ hash: async () => "hash" }));
vi.mock("@/lib/yume/resolve-client", () => ({ resolveClient: m.resolve }));
vi.mock("@/lib/yume/create-booking", () => ({ createCrmBooking: m.crm }));
vi.mock("@/lib/telegram/notify", () => ({ notifyNewBooking: vi.fn() }));
vi.mock("@/lib/pricing", () => ({ quote: async () => ({ pricePerDay: 20000, totalPrice: 40000, deposit: 30000, withoutDeposit: 5000 }), isQuoteError: () => false }));
import { POST } from "./route";

beforeEach(() => {
  vi.resetAllMocks();
  m.car.mockResolvedValue({ id: "car", inventoryId: 25, number: "461CQ01", model: { name: "Accent", brand: { name: "Hyundai" } } });
  m.userCreate.mockResolvedValue({ id: "user", clientId: null, email: "meder.amatov@gmail.com", phone: "+77012219116", firstName: "Медер", lastName: "Аматов", iin: null });
  m.userFind.mockResolvedValue(null);
  m.booking.mockImplementation(async ({ data }) => ({ id: "booking", ...data }));
  m.resolve.mockResolvedValue(3466);
  m.crm.mockResolvedValue(100);
});

test("быстрая регистрация привязывает CRM-клиента по телефону и отправляет бронь", async () => {
  // email/phone lookup → созданный аккаунт → сохранённая CRM-привязка → auth response
  m.userFind.mockResolvedValueOnce(null).mockResolvedValueOnce(null).mockResolvedValueOnce(null)
    .mockResolvedValueOnce(await m.userCreate())
    .mockResolvedValueOnce({ clientId: 3466 })
    .mockResolvedValueOnce(null);
  const res = await POST(new Request("http://localhost/api/bookings", {
    method: "POST", body: JSON.stringify({ carId: "car", customerName: "Медер Аматов", customerPhone: "+7 701 221 91 16", customerEmail: "meder.amatov@gmail.com", otpCode: "123456", startDate: "2030-10-02 10:00", endDate: "2030-10-04 10:00" }),
  }));
  expect(res.status).toBe(200);
  expect(m.resolve).toHaveBeenCalledWith(expect.objectContaining({ phone: "+77012219116", email: "meder.amatov@gmail.com" }));
  expect(m.crm).toHaveBeenCalledWith(expect.objectContaining({ clientId: 3466, inventoryId: 25 }));
  expect(m.booking).toHaveBeenCalledWith({ data: expect.objectContaining({ userId: "user", requestId: 100 }) });
});
