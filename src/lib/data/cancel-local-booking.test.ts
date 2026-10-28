import { beforeEach, expect, test, vi } from "vitest";
const m = vi.hoisted(() => ({ find: vi.fn(), update: vi.fn(), emit: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { $transaction: async (run: (tx: unknown) => unknown) => run({
  $queryRaw: vi.fn(), booking: { findUnique: m.find, update: m.update },
}) } }));
vi.mock("@/lib/events/booking-events", () => ({ emitBookingChanged: m.emit }));
import { cancelLocalBooking } from "./cancel-local-booking";
const booking = { id: "booking", userId: "user", requestId: null, status: "PENDING", source: "SITE", user: { clientId: 3466 } };
beforeEach(() => { vi.resetAllMocks(); m.find.mockResolvedValue({ ...booking }); });

test.each(["SITE", "MOBILE"])("менеджер отменяет локальную заявку из %s и уведомляет устройства клиента", async (source) => {
  m.find.mockResolvedValue({ ...booking, source });
  expect(await cancelLocalBooking("booking", "Передумал")).toEqual({ ok: true });
  expect(m.update).toHaveBeenCalledWith({ where: { id: "booking" }, data: { status: "CANCELLED", cancellationReason: "Передумал" } });
  expect(m.emit).toHaveBeenCalledWith(expect.objectContaining({ userId: "user", clientId: 3466, status: "CANCELLED", prevStatus: "PENDING" }));
});
test("повторная отмена не меняет причину и не создаёт повторное событие", async () => {
  m.find.mockResolvedValue({ ...booking, status: "CANCELLED" });
  expect(await cancelLocalBooking("booking", null)).toEqual({ ok: true });
  expect(m.update).not.toHaveBeenCalled();
  expect(m.emit).not.toHaveBeenCalled();
});
test("заявку, отправленную в CRM до получения блокировки, локально не отменяет", async () => {
  m.find.mockResolvedValue({ ...booking, requestId: 100 });
  expect(await cancelLocalBooking("booking", null)).toMatchObject({ ok: false, error: "BOOKING_IN_CRM" });
  expect(m.update).not.toHaveBeenCalled();
});
test.each(["ACTIVE", "RETURN_PENDING", "COMPLETED"])("не отменяет заявку в статусе %s", async (status) => {
  m.find.mockResolvedValue({ ...booking, status });
  expect(await cancelLocalBooking("booking", null)).toMatchObject({ ok: false, error: "BOOKING_NOT_CANCELLABLE" });
  expect(m.update).not.toHaveBeenCalled();
});
test("подтверждённую локальную заявку тоже можно отменить", async () => {
  m.find.mockResolvedValue({ ...booking, status: "CONFIRMED" });
  expect(await cancelLocalBooking("booking", null)).toEqual({ ok: true });
});
test("неизвестная заявка возвращает 404", async () => {
  m.find.mockResolvedValue(null);
  expect(await cancelLocalBooking("booking", null)).toMatchObject({ ok: false, status: 404 });
});
