import { getSession } from "@/lib/auth";
import { getAlternativeCars } from "@/lib/data/booking-alternatives";
import { getOwnedBooking } from "@/lib/data/owned-booking";
import { NextRequest, NextResponse } from "next/server";

/**
 * Свободные машины той же группы (модель/год/цвет/цена), на которые клиент
 * может поменять авто в заявке. Только для PENDING — как и отмена.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const booking = await getOwnedBooking(session.userId, id);
  if (!booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (booking.status !== "PENDING") {
    return NextResponse.json({ error: "Cannot change" }, { status: 400 });
  }

  const cars = await getAlternativeCars(booking);
  return NextResponse.json({
    current: { id: booking.car.id, number: booking.car.number },
    cars: cars.map(({ inventoryId: _inv, ...car }) => car),
  });
}
