import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@/generated/prisma/enums";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");

    const where = status && Object.values(BookingStatus).includes(status as BookingStatus)
      ? { status: status as BookingStatus }
      : {};

    const bookings = await prisma.booking.findMany({
      where,
      include: { car: { include: { model: { include: { brand: true } } } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Get bookings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
