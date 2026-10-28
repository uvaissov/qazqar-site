import { beforeEach, expect, test, vi } from "vitest";
const m = vi.hoisted(() => ({ auth: vi.fn(), find: vi.fn(), update: vi.fn(), pending: vi.fn(), export: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireSection: m.auth }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  user: { findUnique: m.find },
  $transaction: async (run: (tx: unknown) => unknown) => run({ $queryRaw: vi.fn(), user: { update: m.update } }),
} }));
vi.mock("@/lib/data/export-booking", () => ({ exportBooking: m.export, pendingCrmBookings: m.pending }));
vi.mock("@/lib/yume/find-clients", () => ({ findClientCandidates: vi.fn() }));
import { POST } from "./route";
const post = (body: unknown) => POST(new Request("http://localhost/api/admin/users/user/link-crm", {
  method: "POST", body: JSON.stringify(body),
}), { params: Promise.resolve({ id: "user" }) });
beforeEach(() => {
  vi.resetAllMocks();
  m.find.mockResolvedValue({ id: "user", clientId: 3466 });
  m.pending.mockResolvedValue([{ id: "booking" }]);
  m.export.mockResolvedValue(100);
});

test("привязка возвращает брони для вопроса, но не создаёт их в CRM", async () => {
  const response = await post({ clientId: 3466 });
  expect(await response.json()).toMatchObject({ success: true, pendingBookings: [{ id: "booking" }] });
  expect(m.update).toHaveBeenCalledWith({ where: { id: "user" }, data: { clientId: 3466 } });
  expect(m.export).not.toHaveBeenCalled();
});
test("подтверждение экспортирует выбранные брони и не меняет привязку", async () => {
  const response = await post({ clientId: 3466, bookingIds: ["booking", "booking"] });
  expect(await response.json()).toMatchObject({ success: true, results: [{ bookingId: "booking", requestId: 100 }] });
  expect(m.export).toHaveBeenCalledTimes(1);
  expect(m.update).not.toHaveBeenCalled();
  expect(m.auth).toHaveBeenCalledWith("bookings");
});
test("отказ в доступе блокирует экспорт", async () => {
  m.auth.mockRejectedValue(new Error("denied"));
  expect((await post({ clientId: 3466, bookingIds: ["booking"] })).status).toBe(401);
  expect(m.export).not.toHaveBeenCalled();
});
test("экспорт требует прав на бронирования", async () => {
  m.auth.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("denied"));
  expect((await post({ clientId: 3466, bookingIds: ["booking"] })).status).toBe(403);
  expect(m.export).not.toHaveBeenCalled();
});
test("сменившаяся привязка не перезаписывается подтверждением старого окна", async () => {
  m.find.mockResolvedValue({ clientId: 999 });
  expect((await post({ clientId: 3466, bookingIds: ["booking"] })).status).toBe(409);
  expect(m.export).not.toHaveBeenCalled();
});
