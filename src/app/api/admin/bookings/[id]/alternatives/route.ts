import { requireSection } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAlternativeCars } from "@/lib/data/booking-alternatives";
import { CAR_CHANGEABLE_STATUSES } from "@/lib/data/change-booking-car";
import { NextRequest, NextResponse } from "next/server";

/**
 * Свободные машины той же группы (модель/год/цвет/цена), на которые
 * менеджер может поменять авто в заявке клиента.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSection("bookings");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
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

  const cars = await getAlternativeCars(booking);
  return NextResponse.json({
    current: { id: booking.car.id, number: booking.car.number },
    cars: cars.map(({ inventoryId: _inv, ...car }) => car),
  });
}
