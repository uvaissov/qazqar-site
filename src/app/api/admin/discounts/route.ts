import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const discounts = await prisma.discount.findMany({
      orderBy: { minDays: "asc" },
    });
    return NextResponse.json(discounts);
  } catch (error) {
    console.error("Get discounts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch discounts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { minDays, maxDays, percent, active } = body;

    if (minDays == null || maxDays == null || percent == null) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const discount = await prisma.discount.create({
      data: {
        minDays: Number(minDays),
        maxDays: Number(maxDays),
        percent: Number(percent),
        active: active ?? true,
      },
    });

    return NextResponse.json(discount, { status: 201 });
  } catch (error) {
    console.error("Create discount error:", error);
    return NextResponse.json(
      { error: "Failed to create discount" },
      { status: 500 }
    );
  }
}
