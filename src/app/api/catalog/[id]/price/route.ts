import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    const dateStartParam = searchParams.get("dateStart");
    const dateEndParam = searchParams.get("dateEnd");

    // Validate required params
    if (!dateStartParam || !dateEndParam) {
      return NextResponse.json(
        { error: "dateStart and dateEnd are required" },
        { status: 400 }
      );
    }

    const start = new Date(dateStartParam);
    const end = new Date(dateEndParam);

    // Validate date parsing
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    // Validate dateStart < dateEnd
    if (start >= end) {
      return NextResponse.json(
        { error: "dateStart must be before dateEnd" },
        { status: 400 }
      );
    }

    // Validate dates are in the future
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (start < now) {
      return NextResponse.json(
        { error: "dateStart must be in the future" },
        { status: 400 }
      );
    }

    // Find car by id
    const car = await prisma.car.findUnique({
      where: { id },
      select: { id: true, pricePerDay: true, status: true },
    });

    if (!car || car.status !== "AVAILABLE") {
      return NextResponse.json(
        { error: "Car not found" },
        { status: 404 }
      );
    }

    // Calculate rental days
    const days = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Check availability - no overlapping bookings
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        carId: id,
        status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] },
        startDate: { lt: end },
        endDate: { gt: start },
      },
      select: { id: true },
    });

    if (conflictingBooking) {
      return NextResponse.json({ available: false, error: "CAR_UNAVAILABLE" });
    }

    // Find best applicable discount (highest percent where minDays <= days)
    const discount = await prisma.discount.findFirst({
      where: {
        active: true,
        minDays: { lte: days },
      },
      orderBy: { percent: "desc" },
    });

    const discountPercent = discount?.percent ?? 0;
    const subtotal = car.pricePerDay * days;
    const discountAmount = Math.round((subtotal * discountPercent) / 100);
    const totalPrice = subtotal - discountAmount;

    return NextResponse.json({
      carId: car.id,
      pricePerDay: car.pricePerDay,
      days,
      subtotal,
      discountPercent,
      discountAmount,
      totalPrice,
      available: true,
    });
  } catch (error) {
    console.error("Price calculation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
