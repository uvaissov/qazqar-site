// Заводит тарифные сетки из прайс-листа и привязывает к ним машины.
//
// Источник — prisma/seed/tariffs.json (первый лист «Тарифы с 15.05.26»,
// уже нормализованный: Excel превращал «1-2» и «3-5» в даты, «15-30» после
// «6-15» сдвинут на 16-30, «BYD Seal 05 гибрид» слит с «BYD Seal 05»).
//
// По умолчанию — dry-run: печатает, что будет сделано, и ничего не пишет.
// Запись только с флагом --apply:
//
//   npx tsx scripts/import-tariffs.ts            # отчёт
//   npx tsx scripts/import-tariffs.ts --apply    # применить
//
// Идемпотентен: тариф ищется по имени, ступени заменяются целиком, машины
// с уже назначенным тарифом не трогаются (ручную привязку не перебиваем).
//
// Привязка: тариф описывает (бренд, модель, годы). Машина берёт тариф,
// если её год попал в диапазон; при нескольких совпадениях — самый узкий
// диапазон (Sonata 2022 → «Sonata 2022», а не «Sonata 2023» 2022–2023).
// Если по году не подошёл ни один, а тариф на модель ровно один — берём его
// (BYD Seal 05 в базе 2025 года, в прайсе — 2026). Остальное — в отчёт.

import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { validateTiers } from "../src/lib/pricing";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const APPLY = process.argv.includes("--apply");

type SeedTariff = {
  name: string;
  years: string;
  deposit: number;
  /** Группы машин прайс-листа, накрытые этим тарифом («Hyundai Sonata 2022», «KIA K5 2021»). */
  groups?: string[];
  tiers: { minDays: number; maxDays: number; priceSummer: number; priceWinter: number }[];
};

type Target = { brand: string; model: string; yearFrom: number; yearTo: number };

/** «Hyundai Elantra 22», «2024 - 2025» → Hyundai / Elantra / 2024..2025 */
function targetOf(groupName: string, years: string): Target {
  const words = groupName.trim().split(/\s+/);
  const brand = words[0];
  // Хвостовой год — «2024» или «22» (2020-е); «Seal 05» и «Camry 70» — часть модели
  const model = words
    .slice(1)
    .filter((w, i, arr) => !((/^\d{4}$/.test(w) || /^2\d$/.test(w)) && i === arr.length - 1))
    .join(" ");
  const ys = years.match(/\d{4}/g)?.map(Number) ?? [];
  const yearFrom = ys[0] ?? 0;
  const yearTo = ys[ys.length - 1] ?? yearFrom;
  return { brand, model, yearFrom, yearTo };
}

/**
 * Цели привязки тарифа: по одной на каждую группу прайс-листа. Одинаковые
 * сетки слиты в один тариф («Sonata 2022 / KIA K5 2021»), годы у групп
 * перечислены через запятую в том же порядке.
 */
function targetsOf(t: SeedTariff): Target[] {
  const groups = t.groups ?? [t.name];
  const years = t.years.split(",").map((y) => y.trim());
  return groups.map((g, i) => targetOf(g, years[i] ?? years[0] ?? ""));
}

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

async function main() {
  const seed: SeedTariff[] = JSON.parse(readFileSync("prisma/seed/tariffs.json", "utf-8"));
  console.log(`${APPLY ? "ПРИМЕНЕНИЕ" : "DRY-RUN"}: тарифов в прайс-листе: ${seed.length}`);

  for (const t of seed) {
    const error = validateTiers(t.tiers);
    if (error) throw new Error(`«${t.name}»: ${error}`);
  }

  // 1. Тарифы. Слитый тариф мог существовать под именами частей
  // («Hyundai Sonata 2022», «KIA K5 2021») — их машины переводятся на
  // объединённый, опустевшие тарифы удаляются.
  const tariffIds = new Map<string, string>();
  for (const t of seed) {
    const existing = await prisma.tariff.findUnique({ where: { name: t.name }, include: { tiers: true } });
    const parts = (t.groups ?? []).filter((g) => g !== t.name);
    const stale = parts.length
      ? await prisma.tariff.findMany({ where: { name: { in: parts } }, include: { _count: { select: { cars: true } } } })
      : [];
    for (const s of stale) console.log(`слить   «${s.name}» (машин: ${s._count.cars}) → «${t.name}»`);
    console.log(`${existing ? "обновить" : "создать "} «${t.name}»: депозит ${t.deposit}, ступеней ${t.tiers.length}`);
    if (!APPLY) continue;
    const saved = existing
      ? await prisma.$transaction(async (tx) => {
          await tx.tariffTier.deleteMany({ where: { tariffId: existing.id } });
          return tx.tariff.update({
            where: { id: existing.id },
            data: { deposit: t.deposit, active: true, tiers: { create: t.tiers } },
          });
        })
      : await prisma.tariff.create({ data: { name: t.name, deposit: t.deposit, tiers: { create: t.tiers } } });
    tariffIds.set(t.name, saved.id);
    for (const s of stale) {
      await prisma.car.updateMany({ where: { tariffId: s.id }, data: { tariffId: saved.id } });
      await prisma.tariff.delete({ where: { id: s.id } });
    }
  }

  // 2. Привязка машин
  const targets = seed.flatMap((t) => targetsOf(t).map((target) => ({ tariff: t, target })));
  const cars = await prisma.car.findMany({
    where: { isArchived: false },
    include: { model: { include: { brand: true } } },
    orderBy: [{ model: { brand: { name: "asc" } } }, { model: { name: "asc" } }, { year: "asc" }],
  });

  let bound = 0;
  const unbound: string[] = [];
  const kept: string[] = [];
  for (const car of cars) {
    const label = `${car.model.brand.name} ${car.model.name} ${car.year} · ${car.number}`;
    if (car.tariffId) {
      kept.push(label);
      continue;
    }
    const sameModel = targets.filter(
      ({ target }) => norm(target.brand) === norm(car.model.brand.name) && norm(target.model) === norm(car.model.name)
    );
    const byYear = sameModel
      .filter(({ target }) => car.year >= target.yearFrom && car.year <= target.yearTo)
      .sort((a, b) => a.target.yearTo - a.target.yearFrom - (b.target.yearTo - b.target.yearFrom));
    const chosen = byYear[0] ?? (sameModel.length === 1 ? sameModel[0] : undefined);
    if (!chosen) {
      unbound.push(label);
      continue;
    }
    console.log(`  ${label} → «${chosen.tariff.name}»${byYear[0] ? "" : " (по модели, год вне диапазона)"}`);
    bound++;
    if (APPLY) {
      const tariffId = tariffIds.get(chosen.tariff.name);
      if (!tariffId) throw new Error(`нет id тарифа «${chosen.tariff.name}»`);
      await prisma.car.update({ where: { id: car.id }, data: { tariffId } });
    }
  }

  // 3. Витринная цена — ступень 1–2 дня текущего сезона
  if (APPLY) {
    const { refreshAllDisplayPrices } = await import("../src/lib/pricing");
    await refreshAllDisplayPrices();
  }

  console.log(`\nПривязано: ${bound}, уже с тарифом: ${kept.length}, без тарифа: ${unbound.length}`);
  if (unbound.length) {
    console.log("Без тарифа (привязать руками в админке):");
    for (const l of unbound) console.log(`  - ${l}`);
  }
  if (!APPLY) console.log("\nНичего не записано. Для применения: --apply");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
