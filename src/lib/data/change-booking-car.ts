import { prisma } from "@/lib/prisma";
import { BLOCKING_BOOKING_STATUSES } from "@/lib/data/cars";
import { getAlternativeCars } from "@/lib/data/booking-alternatives";
import { yumeApi } from "@/lib/yume/api";
import type { Booking, Car } from "@/generated/prisma/client";

/** Бросается внутри транзакции при пересечении дат с существующей бронью. */
class BookingConflictError extends Error {}

/**
 * Пока авто не выдано клиенту: заявка создана (PENDING) или подтверждена
 * менеджером (CONFIRMED, в CRM — «бронь»). После выдачи (ACTIVE) менять
 * машину в заявке бессмысленно — клиент уже уехал на конкретной.
 */
export const CAR_CHANGEABLE_STATUSES: string[] = ["PENDING", "CONFIRMED"];

export type ChangeCarResult =
  | { ok: true; car: { id: string; number: string } }
  | { ok: false; status: 400 | 409 | 502; error: "Same car" | "CAR_UNAVAILABLE" | "CRM_ERROR" };

/**
 * Смена автомобиля в заявке менеджером на свободное авто той же группы
 * (модель/год/цвет/цена — цена и депозит заявки не меняются).
 *
 *  1. кандидат обязан пройти тот же фильтр, что показан в списке
 *     (та же группа, свободен локально и в CRM) — иначе через API можно
 *     подсунуть любое авто;
 *  2. сначала CRM, потом локальная БД. CRM — источник истины по заявкам:
 *     если bulk_update отбит, локально ничего не меняем. Обратный порядок
 *     оставил бы у нас одну машину, а в CRM другую.
 *
 * Гейт по статусу — на вызывающей стороне (см. CAR_CHANGEABLE_STATUSES).
 */
export async function changeBookingCar(
  booking: Booking & { car: Car },
  carId: string
): Promise<ChangeCarResult> {
  if (carId === booking.carId) {
    return { ok: false, status: 400, error: "Same car" };
  }

  const alternatives = await getAlternativeCars(booking);
  const newCar = alternatives.find((c) => c.id === carId);
  if (!newCar) {
    return { ok: false, status: 409, error: "CAR_UNAVAILABLE" };
  }

  if (booking.requestId) {
    try {
      const links = await yumeApi.getRequestInventories(booking.requestId);
      const link =
        links.find((l) => l.inventory.id === booking.car.inventoryId) ?? links[0];
      if (!link) {
        console.error(`[ChangeCar] CRM #${booking.requestId}: no inventory link`);
        return { ok: false, status: 502, error: "CRM_ERROR" };
      }
      await yumeApi.replaceRequestInventory(booking.requestId, link, newCar.inventoryId);
      // В ленте заявки в CRM видно, что машину поменяли с сайта, а не в CRM.
      await yumeApi
        .addRequestComment(
          booking.requestId,
          `Менеджер (сайт) сменил автомобиль: ${booking.car.number} → ${newCar.number}`
        )
        .catch((err) => console.error("[ChangeCar] comment failed:", err));
    } catch (err) {
      console.error(`[ChangeCar] CRM #${booking.requestId} bulk_update failed:`, err);
      return { ok: false, status: 502, error: "CRM_ERROR" };
    }
  }

  // Локально — под advisory-блокировкой по новому авто, как при создании
  // заявки (C4): параллельный запрос не должен занять ту же машину.
  try {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${carId}))`;
      const conflict = await tx.booking.findFirst({
        where: {
          carId,
          id: { not: booking.id },
          status: { in: [...BLOCKING_BOOKING_STATUSES] },
          startDate: { lt: booking.endDate },
          endDate: { gt: booking.startDate },
        },
      });
      if (conflict) throw new BookingConflictError();
      await tx.booking.update({ where: { id: booking.id }, data: { carId } });
    });
  } catch (err) {
    if (err instanceof BookingConflictError) {
      // CRM уже переключён на новое авто — локально догоним при следующем
      // syncUserBookings (он берёт carId из inventories заявки).
      console.error(`[ChangeCar] local conflict after CRM update, booking ${booking.id}`);
      return { ok: false, status: 409, error: "CAR_UNAVAILABLE" };
    }
    throw err;
  }

  return { ok: true, car: { id: newCar.id, number: newCar.number } };
}
