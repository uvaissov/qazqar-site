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
    const surcharges = await prisma.noDepositSurcharge.findMany({
      orderBy: { minDay: "asc" },
    });
    return NextResponse.json(surcharges);
  } catch (error) {
    console.error("Get surcharges error:", error);
    return NextResponse.json({ error: "Failed to fetch surcharges" }, { status: 500 });
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
    const { minDay, maxDay, percent } = body;

    if (minDay == null || maxDay == null || percent == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const surcharge = await prisma.noDepositSurcharge.create({
      data: {
        minDay: Number(minDay),
        maxDay: Number(maxDay),
        percent: Number(percent),
      },
    });

    return NextResponse.json(surcharge, { status: 201 });
  } catch (error) {
    console.error("Create surcharge error:", error);
    return NextResponse.json({ error: "Failed to create surcharge" }, { status: 500 });
  }
}
