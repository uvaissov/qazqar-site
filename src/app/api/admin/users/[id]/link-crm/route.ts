import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { yumeApi } from "@/lib/yume/api";
import type { YumeClient } from "@/lib/yume/api";
import { NextResponse } from "next/server";

// GET — search CRM clients matching this user (by IIN and phone)
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
    const user = await prisma.user.findUnique({
      where: { id },
      select: { email: true, iin: true, phone: true, clientId: true, firstName: true, lastName: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const candidates = new Map<number, YumeClient>();

    // Search by email
    if (user.email) {
      const byEmail = await yumeApi.searchClients(user.email);
      for (const c of byEmail) candidates.set(c.id, c);
    }

    // Search by phone
    if (user.phone) {
      const byPhone = await yumeApi.searchClients(user.phone);
      for (const c of byPhone) candidates.set(c.id, c);
    }

    // Search by IIN
    if (user.iin) {
      const byIin = await yumeApi.searchClients(user.iin);
      for (const c of byIin) candidates.set(c.id, c);
    }

    return NextResponse.json({
      currentClientId: user.clientId,
      candidates: [...candidates.values()],
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
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { clientId } = await request.json();

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.user.update({
      where: { id },
      data: { clientId: clientId ? Number(clientId) : null },
    });

    return NextResponse.json({ success: true, clientId });
  } catch (error) {
    console.error("Link CRM error:", error);
    return NextResponse.json(
      { error: "Failed to link CRM client" },
      { status: 500 }
    );
  }
}
