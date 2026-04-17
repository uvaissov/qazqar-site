import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findClientCandidates } from "@/lib/yume/find-clients";
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

    const newClientId = clientId ? Number(clientId) : null;

    await prisma.user.update({
      where: { id },
      data: { clientId: newClientId },
    });

    return NextResponse.json({ success: true, clientId: newClientId });
  } catch (error) {
    console.error("Link CRM error:", error);
    return NextResponse.json(
      { error: "Failed to link CRM client" },
      { status: 500 }
    );
  }
}
