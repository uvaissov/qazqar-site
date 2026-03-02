import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookings = await prisma.booking.findMany({
    where: { userId: session.userId },
    include: {
      car: {
        include: { model: { include: { brand: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ bookings });
}
