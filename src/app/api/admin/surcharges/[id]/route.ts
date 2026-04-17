import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const { minDay, maxDay, percent } = body;

    if (minDay == null || maxDay == null || percent == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const surcharge = await prisma.noDepositSurcharge.update({
      where: { id },
      data: {
        minDay: Number(minDay),
        maxDay: Number(maxDay),
        percent: Number(percent),
      },
    });

    return NextResponse.json(surcharge);
  } catch (error) {
    console.error("Update surcharge error:", error);
    return NextResponse.json({ error: "Failed to update surcharge" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    await prisma.noDepositSurcharge.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete surcharge error:", error);
    return NextResponse.json({ error: "Failed to delete surcharge" }, { status: 500 });
  }
}
