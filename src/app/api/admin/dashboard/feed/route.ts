import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { DashboardBooking } from "@/components/admin/types";

const LIMIT = 50;

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [pending, returnPending] = await Promise.all([
      prisma.booking.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
        take: LIMIT,
        include: {
          car: { include: { model: { include: { brand: true } } } },
        },
      }),
      prisma.booking.findMany({
        where: { status: "RETURN_PENDING" },
        orderBy: { createdAt: "desc" },
        take: LIMIT,
        include: {
          car: { include: { model: { include: { brand: true } } } },
        },
      }),
    ]);

    const toDto = (
      b: (typeof pending)[number],
      status: "PENDING" | "RETURN_PENDING"
    ): DashboardBooking => ({
      id: b.id,
      requestId: b.requestId,
      status,
      startDate: b.startDate.toISOString(),
      endDate: b.endDate.toISOString(),
      totalPrice: b.totalPrice,
      customerName: b.customerName,
      customerPhone: b.customerPhone,
      createdAt: b.createdAt.toISOString(),
      car: b.car
        ? {
            brand: b.car.model.brand.name,
            modelName: b.car.model.name,
            number: b.car.number,
          }
        : null,
    });

    return NextResponse.json({
      pending: pending.map((b) => toDto(b, "PENDING")),
      returnPending: returnPending.map((b) => toDto(b, "RETURN_PENDING")),
      serverTs: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[admin/dashboard/feed] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard feed" },
      { status: 500 }
    );
  }
}
