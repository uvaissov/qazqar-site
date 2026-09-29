import { prisma } from "@/lib/prisma";
import { isCarPublic } from "@/lib/data/cars";
import { isQuoteError, quote } from "@/lib/pricing";
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
      select: {
        id: true,
        deposit: true,
        status: true,
        isArchived: true,
        isHidden: true,
        tariff: { include: { tiers: true } },
      },
    });

    if (!car || !isCarPublic(car) || car.status !== "AVAILABLE") {
      return NextResponse.json(
        { error: "Car not found" },
        { status: 404 }
      );
    }

    // Check availability - no overlapping bookings
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        carId: id,
        status: { in: ["CONFIRMED", "ACTIVE"] },
        startDate: { lt: end },
        endDate: { gt: start },
      },
      select: { id: true },
    });

    if (conflictingBooking) {
      return NextResponse.json({ available: false, error: "CAR_UNAVAILABLE" });
    }

    // Цена — по тарифной сетке машины (docs/plans/2026-09-20-tariff-grid-design.md).
    // Срок длиннее сетки и машина без тарифа — ошибки 400 с кодом для клиента.
    const q = await quote(car, start, end);
    if (isQuoteError(q)) {
      return NextResponse.json(q, { status: 400 });
    }

    return NextResponse.json({
      carId: car.id,
      pricePerDay: q.pricePerDay,
      days: q.days,
      subtotal: q.totalPrice,
      totalPrice: q.totalPrice,
      depositBase: q.deposit,
      withoutDeposit: q.withoutDeposit,
      season: q.season,
      tariff: q.tariff,
      appliedTierId: q.tier.id,
      // Скидок больше нет — поля оставлены ради старых сборок мобилки,
      // которые считают итог как pricePerDay × days × (1 − discountPercent).
      discountPercent: 0,
      discountAmount: 0,
      discounts: [],
      appliedDiscountId: null,
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
