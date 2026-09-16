import { requireSection } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { changeBookingCar, CAR_CHANGEABLE_STATUSES } from "@/lib/data/change-booking-car";
import { NextRequest, NextResponse } from "next/server";

/** Смена автомобиля в заявке клиента менеджером (пока авто не выдано). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSection("bookings");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { carId } = await request.json();
  if (typeof carId !== "string" || !carId) {
    return NextResponse.json({ error: "Missing carId" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { car: true },
  });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (!CAR_CHANGEABLE_STATUSES.includes(booking.status)) {
    return NextResponse.json({ error: "Cannot change" }, { status: 400 });
  }

  const result = await changeBookingCar(booking, carId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, car: result.car });
}
