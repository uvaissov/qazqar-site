import { requireSection } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cancelLocalBooking } from "@/lib/data/cancel-local-booking";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSection("bookings");
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try { await requireSection("bookings"); }
  catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  try {
    const body = await request.json().catch(() => null);
    if (!body || body.status !== "CANCELLED" || (body.reason !== undefined && (typeof body.reason !== "string" || body.reason.length > 1000))) {
      return NextResponse.json({ error: "INVALID_ACTION" }, { status: 400 });
    }
    const { id } = await params;
    const result = await cancelLocalBooking(id, body.reason?.trim() || null);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Cancel local booking error:", err);
    return NextResponse.json({ error: "CANCEL_FAILED" }, { status: 500 });
  }
}
