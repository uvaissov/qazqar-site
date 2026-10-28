import { prisma } from "@/lib/prisma";
import { createCrmBooking } from "@/lib/yume/create-booking";
import { yumeApi } from "@/lib/yume/api";
import { BOOKING_SOURCE_LABELS } from "@/lib/booking-source";

export const UNEXPORTED_BOOKING_STATUSES = ["PENDING", "CONFIRMED"] as const;

/** Даты CRM всегда по Астане, независимо от timezone сервера. */
function crmDate(date: Date) {
  return new Date(date.getTime() + 5 * 3600_000).toISOString().slice(0, 16).replace("T", " ");
}

export async function exportBooking(userId: string, clientId: number, bookingId: string) {
  let createdRequestId: number | undefined;
  try {
    return await prisma.$transaction(async (tx) => {
      // Сериализуем привязку клиента и экспорт; блокировка строки брони
      // также не даёт менять её во время отправки в CRM.
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
      await tx.$queryRaw`SELECT id FROM bookings WHERE id = ${bookingId} FOR UPDATE`;
      const user = await tx.user.findUnique({ where: { id: userId } });
      const booking = await tx.booking.findUnique({ where: { id: bookingId }, include: {
        car: true, pickupAddress: true, returnAddress: true,
      } });
      if (!user || user.clientId !== clientId) throw new Error("CLIENT_CHANGED");
      if (!booking || booking.userId !== userId) throw new Error("BOOKING_NOT_FOUND");
      if (booking.requestId) return booking.requestId;
      if (!(UNEXPORTED_BOOKING_STATUSES as readonly string[]).includes(booking.status)) {
        throw new Error("BOOKING_NOT_ELIGIBLE");
      }
      if (!booking.car.inventoryId) throw new Error("CAR_NOT_LINKED");
      const days = Math.ceil((booking.endDate.getTime() - booking.startDate.getTime()) / 86400_000);
      if (days <= 0) throw new Error("INVALID_DATES");
      // Новые заявки несут комментарий, собранный при создании (с каналом
      // привлечения из запроса); у старых собираем из полей брони.
      const comments = booking.crmComment ? [booking.crmComment] : [`Источник: ${BOOKING_SOURCE_LABELS[booking.source]}`];
      if (!booking.crmComment) {
        if (booking.pickupAddress) comments.push(`Адрес подачи: ${booking.pickupAddress.name}`);
        if (booking.returnAddress) comments.push(`Адрес возврата: ${booking.returnAddress.name}`);
        if (booking.depositLabel) comments.push(booking.depositLabel);
        if (booking.comment) comments.push(booking.comment);
      }
      // Используем сохранённую сумму брони, а не изменившийся прайс машины.
      createdRequestId = await createCrmBooking({
        clientId, inventoryId: booking.car.inventoryId,
        startDate: crmDate(booking.startDate), endDate: crmDate(booking.endDate),
        pricePerDay: booking.totalPrice / days, comment: comments.join("\n"),
        depositAmount: booking.depositAmount ?? 0, withDeposit: booking.withDeposit,
      });
      await tx.booking.update({ where: { id: bookingId }, data: { requestId: createdRequestId } });
      return createdRequestId;
    }, { timeout: 60_000, maxWait: 10_000 });
  } catch (err) {
    if (createdRequestId) {
      await yumeApi.cancelRequest(createdRequestId).catch((cleanup) => console.error("[ExportBooking] cleanup failed", cleanup));
    }
    throw err;
  }
}

export function pendingCrmBookings(userId: string) {
  return prisma.booking.findMany({
    where: { userId, requestId: null, status: { in: [...UNEXPORTED_BOOKING_STATUSES] } },
    select: { id: true, startDate: true, endDate: true, totalPrice: true, car: {
      select: { number: true, model: { select: { name: true, brand: { select: { name: true } } } } },
    } },
    orderBy: { createdAt: "asc" },
  });
}
