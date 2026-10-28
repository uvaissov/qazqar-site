import { yumeApi } from "./api";

/** Одинаковый комплект CRM-заявки для новой и отложенной брони. */
export async function createCrmBooking(input: {
  clientId: number; inventoryId: number; startDate: string; endDate: string;
  pricePerDay: number; comment: string | null; depositAmount: number; withDeposit: boolean;
}): Promise<number> {
  const request = await yumeApi.createRequest({
    client: input.clientId, rent_start: input.startDate, rent_end: input.endDate,
  });
  try {
    await yumeApi.attachInventory(request.id, {
      inventory: input.inventoryId, tarif_price: input.pricePerDay,
      start_at: input.startDate, end_at: input.endDate,
    });
    await yumeApi.saveRequest(request.id, { rent_start: input.startDate, rent_end: input.endDate });
    if (input.comment) await yumeApi.addRequestComment(request.id, input.comment);
    if (input.depositAmount > 0) {
      await yumeApi.addRequestService({
        request: request.id, service: input.withDeposit ? 15 : 5,
        tarif_price: String(input.depositAmount), start_at: input.startDate, end_at: input.endDate,
      });
    }
    return request.id;
  } catch (err) {
    await yumeApi.cancelRequest(request.id).catch((cleanup) => console.error(`[Yume] Failed to cancel request #${request.id}`, cleanup));
    throw err;
  }
}
