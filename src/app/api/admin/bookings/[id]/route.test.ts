import { beforeEach, expect, test, vi } from "vitest";
const m = vi.hoisted(() => ({ auth: vi.fn(), cancel: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireSection: m.auth }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/data/cancel-local-booking", () => ({ cancelLocalBooking: m.cancel }));
import { PATCH } from "./route";
const patch = (body: unknown) => PATCH(new Request("http://localhost/api/admin/bookings/booking", { method: "PATCH", body: JSON.stringify(body) }), { params: Promise.resolve({ id: "booking" }) });
beforeEach(() => { vi.resetAllMocks(); m.cancel.mockResolvedValue({ ok: true }); });
test("проверяет права менеджера и сохраняет очищенную причину", async () => {
  expect((await patch({ status: "CANCELLED", reason: "  Передумал  " })).status).toBe(200);
  expect(m.auth).toHaveBeenCalledWith("bookings");
  expect(m.cancel).toHaveBeenCalledWith("booking", "Передумал");
});
test("без доступа не отменяет", async () => {
  m.auth.mockRejectedValue(new Error("unauthorized"));
  expect((await patch({ status: "CANCELLED" })).status).toBe(401);
  expect(m.cancel).not.toHaveBeenCalled();
});
test.each([null, { status: "ACTIVE" }, { status: "CANCELLED", reason: 42 }, { status: "CANCELLED", reason: "x".repeat(1001) }])("отклоняет неверное действие или причину", async (body) => {
  expect((await patch(body)).status).toBe(400);
  expect(m.cancel).not.toHaveBeenCalled();
});
test("возвращает конфликт, если бронь уже ушла в CRM", async () => {
  m.cancel.mockResolvedValue({ ok: false, status: 409, error: "BOOKING_IN_CRM" });
  expect((await patch({ status: "CANCELLED" })).status).toBe(409);
});
