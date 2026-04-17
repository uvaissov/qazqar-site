import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { yumeApi } from "@/lib/yume/api";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { status, reason } = await request.json();

  // Client can only cancel PENDING bookings
  if (status !== "CANCELLED") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { user: { select: { clientId: true } } },
  });
  const currentUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { clientId: true },
  });
  const ownedByClient =
    currentUser?.clientId != null &&
    booking?.user.clientId === currentUser.clientId;
  if (!booking || (booking.userId !== session.userId && !ownedByClient)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (booking.status !== "PENDING") {
    return NextResponse.json({ error: "Cannot cancel" }, { status: 400 });
  }

  await prisma.booking.update({
    where: { id },
    data: {
      status: "CANCELLED",
      ...(reason && { cancellationReason: reason }),
    },
  });

  // Cancel in Yume CRM and add reason as comment
  if (booking.requestId) {
    try {
      await yumeApi.cancelRequest(booking.requestId);
      if (reason) {
        await yumeApi.addRequestComment(booking.requestId, reason);
      }
    } catch (err) {
      console.error("[Yume] Failed to cancel request:", err);
    }
  }

  return NextResponse.json({ success: true });
}
