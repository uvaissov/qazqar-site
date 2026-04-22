import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { car: { include: { model: { include: { brand: true } } } } },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Get booking error:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}
