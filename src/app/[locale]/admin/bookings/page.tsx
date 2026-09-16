import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { BookingSource, BookingStatus } from "@/generated/prisma/enums";
import BookingsList from "@/components/admin/bookings/BookingsList";

interface AdminBookingsPageProps {
  searchParams: Promise<{ status?: string; source?: string }>;
}

export default async function AdminBookingsPage({
  searchParams,
}: AdminBookingsPageProps) {
  const t = await getTranslations("adminBookings");
  const { status, source } = await searchParams;

  const statusFilter =
    status && Object.values(BookingStatus).includes(status as BookingStatus)
      ? (status as BookingStatus)
      : null;
  const sourceFilter =
    source && Object.values(BookingSource).includes(source as BookingSource)
      ? (source as BookingSource)
      : null;

  // Счётчики статусов считаем в рамках выбранного источника, и наоборот —
  // чтобы цифры на чипах соответствовали тому, что покажет второй фильтр.
  const where = {
    ...(statusFilter && { status: statusFilter }),
    ...(sourceFilter && { source: sourceFilter }),
  };
  const bySource = sourceFilter ? { source: sourceFilter } : {};
  const byStatus = statusFilter ? { status: statusFilter } : {};

  const [
    bookings,
    allCount,
    pendingCount,
    confirmedCount,
    activeCount,
    returnPendingCount,
    completedCount,
    cancelledCount,
  ] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: { car: { include: { model: { include: { brand: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.booking.count({ where: bySource }),
    prisma.booking.count({ where: { ...bySource, status: "PENDING" } }),
    prisma.booking.count({ where: { ...bySource, status: "CONFIRMED" } }),
    prisma.booking.count({ where: { ...bySource, status: "ACTIVE" } }),
    prisma.booking.count({ where: { ...bySource, status: "RETURN_PENDING" } }),
    prisma.booking.count({ where: { ...bySource, status: "COMPLETED" } }),
    prisma.booking.count({ where: { ...bySource, status: "CANCELLED" } }),
  ]);

  const [sourceAll, sourceSite, sourceMobile, sourceCrm] = await Promise.all([
    prisma.booking.count({ where: byStatus }),
    prisma.booking.count({ where: { ...byStatus, source: "SITE" } }),
    prisma.booking.count({ where: { ...byStatus, source: "MOBILE" } }),
    prisma.booking.count({ where: { ...byStatus, source: "CRM" } }),
  ]);
  const sourceCounts = { all: sourceAll, SITE: sourceSite, MOBILE: sourceMobile, CRM: sourceCrm };

  const counts = {
    all: allCount,
    PENDING: pendingCount,
    CONFIRMED: confirmedCount,
    ACTIVE: activeCount,
    RETURN_PENDING: returnPendingCount,
    COMPLETED: completedCount,
    CANCELLED: cancelledCount,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
      </div>

      <BookingsList
        bookings={JSON.parse(JSON.stringify(bookings))}
        counts={counts}
        currentStatus={statusFilter}
        sourceCounts={sourceCounts}
        currentSource={sourceFilter}
      />
    </div>
  );
}
