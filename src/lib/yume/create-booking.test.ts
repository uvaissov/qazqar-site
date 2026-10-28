import { beforeEach, expect, test, vi } from "vitest";
const api = vi.hoisted(() => ({ createRequest: vi.fn(), attachInventory: vi.fn(), saveRequest: vi.fn(), addRequestComment: vi.fn(), addRequestService: vi.fn(), cancelRequest: vi.fn() }));
vi.mock("./api", () => ({ yumeApi: api }));
import { createCrmBooking } from "./create-booking";
const input = { clientId: 3466, inventoryId: 25, startDate: "2030-10-02 10:00", endDate: "2030-10-04 10:00", pricePerDay: 20000, comment: "Тест", depositAmount: 5000, withDeposit: false };
beforeEach(() => {
  vi.resetAllMocks();
  api.createRequest.mockResolvedValue({ id: 100 });
  api.cancelRequest.mockResolvedValue(undefined);
});
test("надбавка без депозита добавляется отдельной услугой", async () => {
  expect(await createCrmBooking(input)).toBe(100);
  expect(api.addRequestService).toHaveBeenCalledWith(expect.objectContaining({ request: 100, service: 5, tarif_price: "5000" }));
  expect(api.cancelRequest).not.toHaveBeenCalled();
});
test.each(["attachInventory", "saveRequest", "addRequestService"] as const)("сбой %s отменяет неполную CRM-заявку", async (method) => {
  api[method].mockRejectedValue(new Error("CRM unavailable"));
  await expect(createCrmBooking(input)).rejects.toThrow("CRM unavailable");
  expect(api.cancelRequest).toHaveBeenCalledWith(100);
});
