import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { syncUserBookings } from "@/lib/yume/sync-bookings";
import { yumeApi } from "@/lib/yume/api";
import {
  cachedDocuments,
  mapDocument,
  needsDocuments,
  type MappedDocument,
} from "@/lib/yume/document-signs";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import BookingsList from "@/components/cabinet/BookingsList";
import BookingsLive from "@/components/cabinet/BookingsLive";

export default async function CabinetBookingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const t = await getTranslations("cabinet");

  // Sync bookings from CRM before displaying
  await syncUserBookings(session.userId).catch(() => {});

  const currentUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { clientId: true },
  });

  const bookings = await prisma.booking.findMany({
    where: currentUser?.clientId
      ? { user: { clientId: currentUser.clientId } }
      : { userId: session.userId },
    include: {
      car: {
        include: {
          model: { include: { brand: true } },
          photos: {
            include: { photo: true },
            orderBy: { sortOrder: "asc" },
            take: 1,
          },
        },
      },
    },
    orderBy: [
      { requestId: { sort: "desc", nulls: "last" } },
      { createdAt: "desc" },
    ],
  });

  // Документы читаем из CRM на лету для заявок в обработке, подтверждённых
  // и в аренде (см. DOCUMENT_STATUSES) и обновляем кэш в БД
  const docsMap: Record<string, MappedDocument[]> = {};
  const bookingsWithDocs = bookings.filter(
    (b) => b.requestId && needsDocuments(b.status)
  );
  await Promise.all(
    bookingsWithDocs.map(async (b) => {
      try {
        const docs = await yumeApi.getRequestDocuments(b.requestId!);
        const mapped = docs.map(mapDocument);
        docsMap[b.id] = mapped;
        // Save to DB cache (fire-and-forget)
        prisma.booking.update({
          where: { id: b.id },
          data: { documents: mapped as unknown as Prisma.InputJsonValue },
        }).catch(() => {});
      } catch {
        // CRM unavailable — use cached from DB
        docsMap[b.id] = cachedDocuments(b.documents);
      }
    })
  );

  // Serialize for client component
  const serialized = bookings.map((b) => ({
    id: b.id,
    carName: `${b.car.model.brand.name} ${b.car.model.name}`,
    carNumber: b.car.number,
    carImage: b.car.photos[0]?.photo.url || null,
    carSlug: b.car.slug,
    startDate: b.startDate.toISOString(),
    endDate: b.endDate.toISOString(),
    totalPrice: b.totalPrice,
    discountPercent: b.discountPercent,
    status: b.status,
    comment: b.comment,
    cancellationReason: b.cancellationReason,
    depositAmount: b.depositAmount,
    depositLabel: b.depositLabel,
    withDeposit: b.withDeposit,
    documents: docsMap[b.id] || [],
    createdAt: b.createdAt.toISOString(),
  }));

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-gray-900">{t("bookings")}</h2>
      <BookingsLive />
      <BookingsList bookings={serialized} />
    </div>
  );
}
