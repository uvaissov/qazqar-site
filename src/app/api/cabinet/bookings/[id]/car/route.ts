import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BLOCKING_BOOKING_STATUSES } from "@/lib/data/cars";
import { getAlternativeCars } from "@/lib/data/booking-alternatives";
import { getOwnedBooking } from "@/lib/data/owned-booking";
import { yumeApi } from "@/lib/yume/api";
import { NextRequest, NextResponse } from "next/server";

/** Бросается внутри транзакции при пересечении дат с существующей бронью. */
class BookingConflictError extends Error {}

/**
 * Смена автомобиля в PENDING-заявке на свободное авто той же группы.
 *
 * Порядок: сначала CRM, потом локальная БД. CRM — источник истины по заявкам,
 * и если bulk_update там отбит (409 — расписание занято), локально ничего
 * не меняем. Обратный порядок оставил бы у нас одну машину, а в CRM другую.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { carId } = await request.json();
  if (typeof carId !== "string" || !carId) {
    return NextResponse.json({ error: "Missing carId" }, { status: 400 });
  }

  const booking = await getOwnedBooking(session.userId, id);
  if (!booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (booking.status !== "PENDING") {
    return NextResponse.json({ error: "Cannot change" }, { status: 400 });
  }
  if (carId === booking.carId) {
    return NextResponse.json({ error: "Same car" }, { status: 400 });
  }

  // Кандидат должен пройти тот же фильтр, что показали клиенту: та же группа
  // и свободен локально и в CRM. Иначе через API можно подсунуть любое авто.
  const alternatives = await getAlternativeCars(booking);
  const newCar = alternatives.find((c) => c.id === carId);
  if (!newCar) {
    return NextResponse.json({ error: "CAR_UNAVAILABLE" }, { status: 409 });
  }

  if (booking.requestId) {
    try {
      const links = await yumeApi.getRequestInventories(booking.requestId);
      const link =
        links.find((l) => l.inventory.id === booking.car.inventoryId) ?? links[0];
      if (!link) {
        console.error(`[ChangeCar] CRM #${booking.requestId}: no inventory link`);
        return NextResponse.json({ error: "CRM_ERROR" }, { status: 502 });
      }
      await yumeApi.replaceRequestInventory(booking.requestId, link, newCar.inventoryId);
      // Менеджеру в ленте заявки видно, что машину поменял клиент, а не коллега.
      await yumeApi
        .addRequestComment(
          booking.requestId,
          `Клиент сменил автомобиль: ${booking.car.number} → ${newCar.number}`
        )
        .catch((err) => console.error("[ChangeCar] comment failed:", err));
    } catch (err) {
      console.error(`[ChangeCar] CRM #${booking.requestId} bulk_update failed:`, err);
      return NextResponse.json({ error: "CRM_ERROR" }, { status: 502 });
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
      return NextResponse.json({ error: "CAR_UNAVAILABLE" }, { status: 409 });
    }
    throw err;
  }

  return NextResponse.json({
    success: true,
    car: { id: newCar.id, number: newCar.number },
  });
}
