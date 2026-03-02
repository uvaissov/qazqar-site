import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await requireAdmin();

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        _count: { select: { bookings: true } },
      },
    });

    return NextResponse.json({ users });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
