import { requireSection } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateTiers } from "@/lib/pricing";
import { NextResponse } from "next/server";

export type TariffInput = {
  name: string;
  deposit: number;
  active: boolean;
  tiers: { minDays: number; maxDays: number; priceSummer: number; priceWinter: number }[];
};

/** Разбор и проверка тела тарифа; текст ошибки — для формы админки. */
export function parseTariffInput(body: unknown): { ok: true; data: TariffInput } | { ok: false; error: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (!name) return { ok: false, error: "Укажите название тарифа" };
  const deposit = Number(b.deposit);
  if (!Number.isInteger(deposit) || deposit < 0) return { ok: false, error: "Депозит — целое число не меньше нуля" };
  const rawTiers = Array.isArray(b.tiers) ? b.tiers : [];
  const tiers = rawTiers.map((t) => {
    const r = (t ?? {}) as Record<string, unknown>;
    return {
      minDays: Number(r.minDays),
      maxDays: Number(r.maxDays),
      priceSummer: Number(r.priceSummer),
      priceWinter: Number(r.priceWinter),
    };
  });
  const tiersError = validateTiers(tiers);
  if (tiersError) return { ok: false, error: tiersError };
  return { ok: true, data: { name, deposit, active: b.active !== false, tiers } };
}

export async function GET() {
  try {
    await requireSection("tariffs");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const tariffs = await prisma.tariff.findMany({
    include: { tiers: { orderBy: { minDays: "asc" } }, _count: { select: { cars: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(tariffs);
}

export async function POST(request: Request) {
  try {
    await requireSection("tariffs");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = parseTariffInput(await request.json());
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { tiers, ...data } = parsed.data;

  if (await prisma.tariff.findUnique({ where: { name: data.name } })) {
    return NextResponse.json({ error: "Тариф с таким названием уже есть" }, { status: 400 });
  }
  const tariff = await prisma.tariff.create({
    data: { ...data, tiers: { create: tiers } },
    include: { tiers: { orderBy: { minDays: "asc" } } },
  });
  return NextResponse.json(tariff, { status: 201 });
}
