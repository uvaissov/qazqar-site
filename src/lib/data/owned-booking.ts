import { prisma } from "@/lib/prisma";

/**
 * Заявка, к которой у пользователя есть доступ из кабинета.
 *
 * Владелец — либо создатель (`userId`), либо любой аккаунт, привязанный к тому
 * же CRM-клиенту: `User.clientId` не уникален, у одного клиента может быть
 * несколько аккаунтов (сайт + мобилка), и все они должны видеть одни заявки.
 */
export async function getOwnedBooking(userId: string, bookingId: string) {
  const [booking, currentUser] = await Promise.all([
    prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        car: true,
        user: { select: { clientId: true } },
      },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { clientId: true },
    }),
  ]);
  if (!booking) return null;

  const ownedByClient =
    currentUser?.clientId != null && booking.user?.clientId === currentUser.clientId;
  if (booking.userId !== userId && !ownedByClient) return null;

  return booking;
}
