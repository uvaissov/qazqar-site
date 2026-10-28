import { requireSection } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findClientCandidates } from "@/lib/yume/find-clients";
import { exportBooking, pendingCrmBookings } from "@/lib/data/export-booking";
import { NextResponse } from "next/server";

// GET — search CRM clients matching this user (by IIN and phone)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSection("users");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: { email: true, iin: true, phone: true, clientId: true, firstName: true, lastName: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (new URL(request.url).searchParams.get("pendingBookings") === "true") {
      return NextResponse.json({ currentClientId: user.clientId, pendingBookings: await pendingCrmBookings(id) });
    }

    const candidates = await findClientCandidates({
      iin: user.iin,
      email: user.email,
      phone: user.phone,
    });

    return NextResponse.json({
      currentClientId: user.clientId,
      candidates,
    });
  } catch (error) {
    console.error("Search CRM clients error:", error);
    return NextResponse.json(
      { error: "Failed to search CRM clients" },
      { status: 500 }
    );
  }
}

// POST — link user to selected CRM client
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSection("users");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { clientId, bookingIds } = await request.json();
    if (clientId !== null && (!Number.isSafeInteger(clientId) || clientId <= 0)) {
      return NextResponse.json({ error: "INVALID_CLIENT_ID" }, { status: 400 });
    }
    if (bookingIds !== undefined && (!Array.isArray(bookingIds) || bookingIds.length > 50 || bookingIds.some((id: unknown) => typeof id !== "string") || !clientId)) {
      return NextResponse.json({ error: "INVALID_BOOKING_IDS" }, { status: 400 });
    }
    if (bookingIds !== undefined) {
      try { await requireSection("bookings"); }
      catch { return NextResponse.json({ error: "Unauthorized" }, { status: 403 }); }
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Второй запрос после подтверждения экспорта не меняет привязку.
    if (bookingIds !== undefined) {
      if (user.clientId !== clientId) return NextResponse.json({ error: "CLIENT_CHANGED" }, { status: 409 });
      const results = [];
      for (const bookingId of [...new Set<string>(bookingIds)]) {
        try {
          const requestId = await exportBooking(id, clientId, bookingId);
          results.push({ bookingId, requestId, success: true });
        } catch (err) {
          console.error(`[LinkCRM] export ${bookingId} failed`, err);
          results.push({ bookingId, success: false });
        }
      }
      return NextResponse.json({ success: results.every((r) => r.success), results, pendingBookings: await pendingCrmBookings(id) });
    }

    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${id} FOR UPDATE`;
      await tx.user.update({ where: { id }, data: { clientId } });
    });

    return NextResponse.json({ success: true, clientId, pendingBookings: clientId ? await pendingCrmBookings(id) : [] });
  } catch (error) {
    console.error("Link CRM error:", error);
    return NextResponse.json(
      { error: "Failed to link CRM client" },
      { status: 500 }
    );
  }
}
