import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import BookingsList from "@/components/cabinet/BookingsList";

export default async function CabinetBookingsPage() {
  const session = await getSession();
  const t = await getTranslations("cabinet");

  const bookings = await prisma.booking.findMany({
    where: { userId: session!.userId },
    include: {
      car: {
        include: { model: { include: { brand: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Serialize for client component
  const serialized = bookings.map((b) => ({
    id: b.id,
    carName: `${b.car.model.brand.name} ${b.car.model.name}`,
    carSlug: b.car.slug,
    startDate: b.startDate.toISOString(),
    endDate: b.endDate.toISOString(),
    totalPrice: b.totalPrice,
    discountPercent: b.discountPercent,
    status: b.status,
    comment: b.comment,
    createdAt: b.createdAt.toISOString(),
  }));

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-gray-900">{t("bookings")}</h2>
      <BookingsList bookings={serialized} />
    </div>
  );
}
