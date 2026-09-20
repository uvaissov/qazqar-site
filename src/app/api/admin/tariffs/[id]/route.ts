import { requireSection } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refreshDisplayPrices } from "@/lib/pricing";
import { NextResponse } from "next/server";
import { parseTariffInput } from "../route";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  try {
    await requireSection("tariffs");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const tariff = await prisma.tariff.findUnique({
    where: { id },
    include: {
      tiers: { orderBy: { minDays: "asc" } },
      cars: { select: { id: true, number: true, year: true, model: { select: { name: true, brand: { select: { name: true } } } } } },
    },
  });
  if (!tariff) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(tariff);
}

/**
 * Ступени сохраняются целиком вместе с тарифом: их четыре, а частичное
 * редактирование потребовало бы проверять непрерывность сетки по кускам.
 */
export async function PUT(request: Request, { params }: Params) {
  try {
    await requireSection("tariffs");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const parsed = parseTariffInput(await request.json());
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { tiers, ...data } = parsed.data;

  const clash = await prisma.tariff.findUnique({ where: { name: data.name } });
  if (clash && clash.id !== id) {
    return NextResponse.json({ error: "Тариф с таким названием уже есть" }, { status: 400 });
  }

  const tariff = await prisma.$transaction(async (tx) => {
    await tx.tariffTier.deleteMany({ where: { tariffId: id } });
    return tx.tariff.update({
      where: { id },
      data: { ...data, tiers: { create: tiers } },
      include: { tiers: { orderBy: { minDays: "asc" } } },
    });
  });
  // Витринная цена машин следует за ступенью 1–2 дня
  await refreshDisplayPrices(id);
  return NextResponse.json(tariff);
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    await requireSection("tariffs");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const cars = await prisma.car.count({ where: { tariffId: id } });
  if (cars > 0) {
    return NextResponse.json(
      { error: `К тарифу привязано машин: ${cars}. Сначала переведите их на другой тариф` },
      { status: 400 }
    );
  }
  await prisma.tariff.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
