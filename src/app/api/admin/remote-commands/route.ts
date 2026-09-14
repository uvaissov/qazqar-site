import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// Журнал SMS-команд на автопульт. Источник — таблица remote_commands.
// Без carId — глобальный список; с carId — срез по машине (через booking.carId).
// status=errors → только неуспешные отправки.
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE),
    );
    const status = searchParams.get("status");
    const carId = searchParams.get("carId");

    const where: Prisma.RemoteCommandWhereInput = {
      ...(status === "errors" ? { ok: false } : {}),
      ...(carId ? { booking: { carId } } : {}),
    };

    const [total, items] = await Promise.all([
      prisma.remoteCommand.count({ where }),
      prisma.remoteCommand.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          booking: {
            select: {
              car: {
                select: {
                  id: true,
                  number: true,
                  model: {
                    select: { name: true, brand: { select: { name: true } } },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    const data = items.map((c) => {
      const car = c.booking?.car;
      return {
        id: c.id,
        createdAt: c.createdAt,
        action: c.action,
        ok: c.ok,
        error: c.error,
        providerId: c.providerId,
        targetPhone: c.targetPhone,
        smsText: c.smsText,
        car: car
          ? {
              id: car.id,
              number: car.number,
              model: car.model?.name ?? null,
              brand: car.model?.brand?.name ?? null,
            }
          : null,
        user: {
          name: `${c.user.firstName} ${c.user.lastName}`.trim(),
          email: c.user.email,
        },
      };
    });

    return NextResponse.json({ items: data, total, page, pageSize });
  } catch (error) {
    console.error("Get remote-commands error:", error);
    return NextResponse.json(
      { error: "Failed to fetch remote commands" },
      { status: 500 },
    );
  }
}
