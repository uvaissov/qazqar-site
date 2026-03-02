import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { carId, customerName, customerPhone, startDate, endDate, comment, userId } =
      body;

    // Validate required fields
    if (!carId || !customerName || !customerPhone || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get car and check availability
    const car = await prisma.car.findUnique({ where: { id: carId } });
    if (!car || car.status !== "AVAILABLE") {
      return NextResponse.json(
        { error: "Car not available" },
        { status: 400 }
      );
    }

    // Calculate days and discount
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days <= 0) {
      return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
    }

    // Find applicable discount
    const discount = await prisma.discount.findFirst({
      where: { active: true, minDays: { lte: days }, maxDays: { gte: days } },
    });

    const discountPercent = discount?.percent ?? 0;
    const totalPrice = Math.round(
      days * car.pricePerDay * (1 - discountPercent / 100)
    );

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        carId,
        customerName,
        customerPhone,
        startDate: start,
        endDate: end,
        totalPrice,
        discountPercent,
        status: "PENDING",
        comment: comment || null,
        userId: userId || undefined,
      },
    });

    return NextResponse.json({ success: true, bookingId: booking.id });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
