import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { BookingStatus } from "@/generated/prisma/enums";
import BookingsList from "@/components/admin/bookings/BookingsList";

interface AdminBookingsPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminBookingsPage({
  searchParams,
}: AdminBookingsPageProps) {
  const t = await getTranslations("adminBookings");
  const { status } = await searchParams;

  const statusFilter =
    status && Object.values(BookingStatus).includes(status as BookingStatus)
      ? (status as BookingStatus)
      : null;

  const where = statusFilter ? { status: statusFilter } : {};

  const [bookings, allCount, pendingCount, confirmedCount, activeCount, completedCount, cancelledCount] =
    await Promise.all([
      prisma.booking.findMany({
        where,
        include: { car: { include: { model: { include: { brand: true } } } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: "PENDING" } }),
      prisma.booking.count({ where: { status: "CONFIRMED" } }),
      prisma.booking.count({ where: { status: "ACTIVE" } }),
      prisma.booking.count({ where: { status: "COMPLETED" } }),
      prisma.booking.count({ where: { status: "CANCELLED" } }),
    ]);

  const counts = {
    all: allCount,
    PENDING: pendingCount,
    CONFIRMED: confirmedCount,
    ACTIVE: activeCount,
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
      />
    </div>
  );
}
