import { beforeEach, expect, test, vi } from "vitest";

const m = vi.hoisted(() => ({
  find: vi.fn(), update: vi.fn(), userUpdate: vi.fn(), userFind: vi.fn(),
  resolve: vi.fn(), exportBooking: vi.fn(), edit: vi.fn(), emit: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: {
  booking: { findUnique: m.find, update: m.update },
  user: { updateMany: m.userUpdate, findUnique: m.userFind },
} }));
vi.mock("@/lib/data/export-booking", () => ({ exportBooking: m.exportBooking }));
vi.mock("./resolve-client", () => ({ resolveClient: m.resolve }));
vi.mock("@/lib/events/booking-events", () => ({ emitBookingChanged: m.emit }));
vi.mock("@/lib/telegram/notify", () => ({ newBookingNotice: (b: unknown) => b, updateNewBookingNotice: m.edit }));
vi.mock("./api", () => ({ YumeApiError: class YumeApiError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
} }));
import { syncBookingToCrm } from "./crm-queue";
import { YumeApiError } from "./api";

const user = { id: "user", clientId: 3466, email: "a@b.kz", phone: "+77012219116", iin: null, firstName: "Медер", lastName: "Аматов" };
const booking = (extra: Record<string, unknown> = {}) => ({
  id: "booking", userId: "user", requestId: null, status: "PENDING", crmSyncAttempts: 0, user, ...extra,
});

beforeEach(() => {
  vi.resetAllMocks();
  m.find.mockResolvedValue(booking());
  m.update.mockImplementation(async ({ data }) => ({ id: "booking", telegramMessageId: 777, ...data }));
  m.exportBooking.mockResolvedValue(100);
});

test("успех: DONE, правка Telegram, событие для мобилки", async () => {
  expect(await syncBookingToCrm("booking")).toBe("DONE");
  expect(m.exportBooking).toHaveBeenCalledWith("user", 3466, "booking");
  expect(m.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ crmSyncStatus: "DONE" }) }));
  expect(m.edit).toHaveBeenCalledWith(777, expect.objectContaining({ crmSyncStatus: "DONE" }));
  expect(m.emit).toHaveBeenCalledWith(expect.objectContaining({ bookingId: "booking", requestId: 100 }));
});

test("аккаунт без CRM-клиента привязывается перед отправкой", async () => {
  m.find.mockResolvedValue(booking({ user: { ...user, clientId: null } }));
  m.resolve.mockResolvedValue(5000);
  m.userFind.mockResolvedValue({ clientId: 5000 });
  await syncBookingToCrm("booking");
  expect(m.userUpdate).toHaveBeenCalledWith({ where: { id: "user", clientId: null }, data: { clientId: 5000 } });
  expect(m.exportBooking).toHaveBeenCalledWith("user", 5000, "booking");
});

test("конфликт дат в Yume — сразу FAILED без повторов", async () => {
  m.exportBooking.mockRejectedValue(new YumeApiError("conflict", 409));
  expect(await syncBookingToCrm("booking")).toBe("FAILED");
  expect(m.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ crmSyncStatus: "FAILED", crmSyncError: "DATE_CONFLICT" }) }));
  expect(m.edit).toHaveBeenCalledWith(777, expect.objectContaining({ crmSyncStatus: "FAILED" }));
});

test("временная ошибка — повтор с бэкоффом, Telegram не трогаем", async () => {
  m.exportBooking.mockRejectedValue(new YumeApiError("bad gateway", 502));
  expect(await syncBookingToCrm("booking")).toBe("PENDING");
  expect(m.update).toHaveBeenCalledWith({ where: { id: "booking" }, data: {
    crmSyncError: "YUME_502", crmSyncAttempts: 1, crmSyncNextAt: expect.any(Date),
  } });
  expect(m.edit).not.toHaveBeenCalled();
});

test("последняя попытка — FAILED", async () => {
  m.find.mockResolvedValue(booking({ crmSyncAttempts: 4 }));
  m.exportBooking.mockRejectedValue(new Error("network"));
  expect(await syncBookingToCrm("booking")).toBe("FAILED");
});

test("заявку отменили локально — снимаем с очереди", async () => {
  m.exportBooking.mockRejectedValue(new Error("BOOKING_NOT_ELIGIBLE"));
  expect(await syncBookingToCrm("booking")).toBeNull();
  expect(m.update).toHaveBeenCalledWith({ where: { id: "booking" }, data: { crmSyncStatus: null, crmSyncNextAt: null } });
});

test("заявка без аккаунта — FAILED NO_USER", async () => {
  m.find.mockResolvedValue(booking({ userId: null, user: null }));
  expect(await syncBookingToCrm("booking")).toBe("FAILED");
  expect(m.exportBooking).not.toHaveBeenCalled();
});
