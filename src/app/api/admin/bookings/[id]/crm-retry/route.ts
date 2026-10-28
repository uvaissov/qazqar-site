import { requireSection } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { retryBookingCrmSync } from "@/lib/yume/crm-queue";
import { NextResponse } from "next/server";

/** «Повторить отправку» заявки, которая не ушла в Yume (crmSyncStatus = FAILED). */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSection("bookings");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const booking = await prisma.booking.findUnique({ where: { id }, select: { crmSyncStatus: true } });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.crmSyncStatus !== "FAILED") {
    return NextResponse.json({ error: "NOT_FAILED" }, { status: 409 });
  }

  const status = await retryBookingCrmSync(id);
  const result = await prisma.booking.findUnique({
    where: { id },
    select: { requestId: true, crmSyncError: true },
  });
  return NextResponse.json({ crmSyncStatus: status, ...result });
}
