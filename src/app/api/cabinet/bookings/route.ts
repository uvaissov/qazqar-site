import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { fuelTypeLabel, transmissionLabel } from "@/lib/utils";
import { syncUserBookings } from "@/lib/yume/sync-bookings";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await syncUserBookings(session.userId).catch((err) => {
    console.error("[cabinet/bookings] sync failed:", err);
  });

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
          photos: { include: { photo: true }, orderBy: { sortOrder: "asc" } },
        },
      },
    },
    orderBy: [
      { requestId: { sort: "desc", nulls: "last" } },
      { createdAt: "desc" },
    ],
  });

  // Transform car to MarkDto-compatible format for Flutter app
  const result = bookings.map((b) => ({
    ...b,
    car: b.car ? {
      id: b.car.id,
      slug: b.car.slug,
      modelName: b.car.model.name,
      brand: {
        id: b.car.model.brand.id,
        name: b.car.model.brand.name,
        slug: b.car.model.brand.slug,
      },
      year: b.car.year,
      color: b.car.color,
      transmission: b.car.transmission,
      transmissionLabel: transmissionLabel(b.car.transmission),
      fuelType: b.car.fuelType,
      fuelTypeLabel: fuelTypeLabel(b.car.fuelType),
      seats: b.car.seats,
      hasAC: b.car.hasAC,
      pricePerDay: b.car.pricePerDay,
      deposit: b.car.deposit,
      status: b.car.status,
      photos: b.car.photos.map((p) => p.photo.url),
    } : null,
  }));

  return NextResponse.json({ bookings: result });
}
