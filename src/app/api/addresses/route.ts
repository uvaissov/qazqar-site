import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Public endpoint: returns only active addresses sorted by sortOrder
export async function GET() {
  try {
    const addresses = await prisma.address.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        address: true,
        lat: true,
        lng: true,
      },
    });
    return NextResponse.json({ addresses });
  } catch (error) {
    console.error("Get addresses error:", error);
    return NextResponse.json(
      { error: "Failed to fetch addresses" },
      { status: 500 }
    );
  }
}
