import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import BookingDetail from "@/components/admin/bookings/BookingDetail";

interface BookingDetailPageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function AdminBookingDetailPage({
  params,
}: BookingDetailPageProps) {
  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { car: { include: { model: { include: { brand: true } } } } },
  });

  if (!booking) {
    notFound();
  }

  return <BookingDetail booking={JSON.parse(JSON.stringify(booking))} />;
}
