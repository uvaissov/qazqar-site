import { prisma } from "@/lib/prisma";
import { emitBookingChanged } from "@/lib/events/booking-events";

export type CancelLocalBookingResult =
  | { ok: true }
  | { ok: false; status: 404 | 409; error: "BOOKING_NOT_FOUND" | "BOOKING_IN_CRM" | "BOOKING_NOT_CANCELLABLE" };

/** Блокировка строки синхронизирует отмену с отправкой заявки в CRM. */
export async function cancelLocalBooking(id: string, reason: string | null): Promise<CancelLocalBookingResult> {
  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM bookings WHERE id = ${id} FOR UPDATE`;
    const booking = await tx.booking.findUnique({ where: { id }, include: { user: { select: { clientId: true } } } });
    if (!booking) return { ok: false as const, status: 404 as const, error: "BOOKING_NOT_FOUND" as const };
    if (booking.requestId !== null || booking.source === "CRM") return { ok: false as const, status: 409 as const, error: "BOOKING_IN_CRM" as const };
    if (booking.status === "CANCELLED") return { ok: true as const, event: null };
    if (!["PENDING", "CONFIRMED"].includes(booking.status)) {
      return { ok: false as const, status: 409 as const, error: "BOOKING_NOT_CANCELLABLE" as const };
    }
    await tx.booking.update({ where: { id }, data: { status: "CANCELLED", cancellationReason: reason } });
    return { ok: true as const, event: {
      bookingId: id, requestId: null, userId: booking.userId,
      clientId: booking.user?.clientId ?? null, status: "CANCELLED", prevStatus: booking.status,
    } };
  });
  if (!result.ok) return result;
  if (result.event) emitBookingChanged(result.event);
  return { ok: true };
}
