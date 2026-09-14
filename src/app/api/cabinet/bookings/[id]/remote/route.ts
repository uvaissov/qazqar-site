import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sendRemoteSms, smsTextFor } from "@/lib/sms/remote-gateway";
import { NextRequest, NextResponse } from "next/server";

type Action = "unlock" | "lock";

function parseAction(v: unknown): Action | null {
  return v === "unlock" || v === "lock" ? v : null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => null);
    const action = parseAction(body?.action);
    if (!action) {
      return NextResponse.json(
        { error: "action must be 'unlock' or 'lock'" },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: { select: { clientId: true } },
        car: { select: { hasRemote: true, remotePhone: true } },
      },
    });
    const currentUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { clientId: true },
    });
    const ownedByClient =
      currentUser?.clientId != null &&
      booking?.user?.clientId === currentUser.clientId;
    if (!booking || (booking.userId !== session.userId && !ownedByClient)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // RETURN_PENDING тоже пускаем: машина ещё физически у клиента — он сдал фото
    // и ждёт приёмки, ему нужно запереть авто и уйти.
    if (booking.status !== "ACTIVE" && booking.status !== "RETURN_PENDING") {
      return NextResponse.json(
        { error: "Remote control available only for active bookings" },
        { status: 400 }
      );
    }

    if (!booking.car.hasRemote || !booking.car.remotePhone) {
      return NextResponse.json(
        { error: "Car is not configured for remote control" },
        { status: 400 }
      );
    }

    const dbAction = action === "unlock" ? "UNLOCK" : "LOCK";
    // Ждём ответ пульта внутри запроса (до REMOTE_SMS_CONFIRM_TIMEOUT_MS):
    // отдельного канала для push-уведомления «замки сработали» у мобилки нет.
    const result = await sendRemoteSms(booking.car.remotePhone, dbAction);

    const record = await prisma.remoteCommand.create({
      data: {
        bookingId: booking.id,
        userId: session.userId,
        action: dbAction,
        targetPhone: booking.car.remotePhone,
        smsText: smsTextFor(dbAction),
        providerId: result.providerId ?? null,
        ok: result.ok,
        error: result.error ?? null,
        replyText: result.reply ?? null,
        confirmedAt: result.confirmed ? new Date() : null,
      },
      select: { id: true, createdAt: true, ok: true, confirmedAt: true },
    });

    return NextResponse.json({
      ok: record.ok,
      confirmed: record.confirmedAt != null,
      action,
      createdAt: record.createdAt,
      id: record.id,
    });
  } catch (err) {
    console.error("[BookingRemote] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
