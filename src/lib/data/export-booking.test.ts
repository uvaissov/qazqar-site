import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  user: vi.fn(), booking: vi.fn(), update: vi.fn(), lock: vi.fn(),
  create: vi.fn(), cancel: vi.fn(), transaction: vi.fn(), list: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: { $transaction: mocks.transaction, booking: { findMany: mocks.list } } }));
vi.mock("@/lib/yume/create-booking", () => ({ createCrmBooking: mocks.create }));
vi.mock("@/lib/yume/api", () => ({ yumeApi: { cancelRequest: mocks.cancel } }));
import { exportBooking, pendingCrmBookings } from "./export-booking";

const booking = () => ({
  id: "booking", userId: "user", requestId: null, status: "PENDING",
  startDate: new Date("2030-10-02T05:00:00Z"), endDate: new Date("2030-10-04T05:00:00Z"),
  totalPrice: 40000, depositAmount: 30000, withDeposit: true, source: "SITE",
  depositLabel: "Депозит 30 000 ₸", comment: "Тест", car: { inventoryId: 25 },
  pickupAddress: { name: "Офис" }, returnAddress: null,
});

beforeEach(() => {
  vi.resetAllMocks();
  mocks.user.mockResolvedValue({ clientId: 3466 });
  mocks.booking.mockResolvedValue(booking());
  mocks.create.mockResolvedValue(100);
  mocks.transaction.mockImplementation(async (run) => run({
    $queryRaw: mocks.lock, user: { findUnique: mocks.user },
    booking: { findUnique: mocks.booking, update: mocks.update },
  }));
  mocks.cancel.mockResolvedValue(undefined);
});

test("экспорт сохраняет цену, депозит, адрес и даты по Астане", async () => {
  expect(await exportBooking("user", 3466, "booking")).toBe(100);
  expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
    clientId: 3466, pricePerDay: 20000, depositAmount: 30000,
    startDate: "2030-10-02 10:00", endDate: "2030-10-04 10:00",
    comment: expect.stringContaining("Адрес подачи: Офис"),
  }));
  expect(mocks.update).toHaveBeenCalledWith({ where: { id: "booking" }, data: { requestId: 100 } });
});

test("повторный экспорт не создаёт дубль", async () => {
  mocks.booking.mockResolvedValue({ ...booking(), requestId: 100 });
  expect(await exportBooking("user", 3466, "booking")).toBe(100);
  expect(mocks.create).not.toHaveBeenCalled();
});

test.each([
  ["чужая бронь", { userId: "other" }, "BOOKING_NOT_FOUND"],
  ["отменённая бронь", { status: "CANCELLED" }, "BOOKING_NOT_ELIGIBLE"],
  ["машина без CRM", { car: { inventoryId: null } }, "CAR_NOT_LINKED"],
])("не экспортирует: %s", async (_name, fields, error) => {
  mocks.booking.mockResolvedValue({ ...booking(), ...fields });
  await expect(exportBooking("user", 3466, "booking")).rejects.toThrow(error);
  expect(mocks.create).not.toHaveBeenCalled();
});

test("смена клиента до подтверждения блокирует экспорт", async () => {
  mocks.user.mockResolvedValue({ clientId: 999 });
  await expect(exportBooking("user", 3466, "booking")).rejects.toThrow("CLIENT_CHANGED");
  expect(mocks.create).not.toHaveBeenCalled();
});

test("при сбое записи requestId отменяет созданную CRM-заявку", async () => {
  mocks.update.mockRejectedValue(new Error("DB failed"));
  await expect(exportBooking("user", 3466, "booking")).rejects.toThrow("DB failed");
  expect(mocks.cancel).toHaveBeenCalledWith(100);
});

test("бронь с прошедшими датами можно отправить после подтверждения менеджером", async () => {
  mocks.booking.mockResolvedValue({ ...booking(), startDate: new Date("2020-10-01T06:00:00Z"), endDate: new Date("2020-10-01T15:00:00Z") });
  expect(await exportBooking("user", 3466, "booking")).toBe(100);
  expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ startDate: "2020-10-01 11:00", endDate: "2020-10-01 20:00" }));
});

test("вопрос после привязки включает неотправленные брони с прошедшими датами", async () => {
  const past = { ...booking(), startDate: new Date("2020-10-01"), endDate: new Date("2020-10-02") };
  mocks.list.mockResolvedValue([past]);
  expect(await pendingCrmBookings("user")).toEqual([past]);
  expect(mocks.list).toHaveBeenCalledWith(expect.objectContaining({ where: {
    userId: "user", requestId: null, status: { in: ["PENDING", "CONFIRMED"] },
  } }));
});
