import { prisma } from "@/lib/prisma";
import type { Tariff, TariffTier } from "@/generated/prisma/client";

/**
 * Расчёт стоимости аренды по тарифной сетке — единственное место, где
 * считаются цена за сутки, итог и надбавка «без депозита». Им пользуются
 * `GET /api/catalog/[id]/price` (витрина) и `POST /api/bookings` (заявка):
 * раньше формула жила в обоих роутах и расходилась.
 *
 * Дизайн: docs/plans/2026-09-20-tariff-grid-design.md
 */

export type Season = "summer" | "winter";

export type TariffWithTiers = Tariff & { tiers: TariffTier[] };

/** Ключи настроек границ лета в `app_settings` (месяцы 1..12, включительно). */
export const SEASON_KEYS = {
  summerFrom: "seasonSummerFrom",
  summerTo: "seasonSummerTo",
} as const;

/** Прайс-лист: летний тариф — «с мая по октябрь». */
export const DEFAULT_SEASON = { summerFrom: 5, summerTo: 10 } as const;

export type SeasonBounds = { summerFrom: number; summerTo: number };

export async function getSeasonBounds(): Promise<SeasonBounds> {
  const rows = await prisma.appSetting.findMany({
    where: { key: { in: [SEASON_KEYS.summerFrom, SEASON_KEYS.summerTo] } },
  });
  const value = (key: string, fallback: number) => {
    const n = Number(rows.find((r) => r.key === key)?.value);
    return Number.isInteger(n) && n >= 1 && n <= 12 ? n : fallback;
  };
  return {
    summerFrom: value(SEASON_KEYS.summerFrom, DEFAULT_SEASON.summerFrom),
    summerTo: value(SEASON_KEYS.summerTo, DEFAULT_SEASON.summerTo),
  };
}

/**
 * Сезон по дате начала аренды. Границы включительные; если «от» позже «до»
 * (лето через Новый год), интервал считается циклическим.
 */
export function seasonFor(date: Date, bounds: SeasonBounds): Season {
  // Месяц берём по Астане: сервер может жить в UTC, а бронь на 1 мая 00:30
  // по местному времени — это ещё 30 апреля по UTC.
  const month = Number(
    new Intl.DateTimeFormat("en-US", { month: "numeric", timeZone: "Asia/Almaty" }).format(date)
  );
  const { summerFrom, summerTo } = bounds;
  const inSummer =
    summerFrom <= summerTo
      ? month >= summerFrom && month <= summerTo
      : month >= summerFrom || month <= summerTo;
  return inSummer ? "summer" : "winter";
}

export function tierPrice(tier: TariffTier, season: Season): number {
  return season === "summer" ? tier.priceSummer : tier.priceWinter;
}

export function sortedTiers(tariff: TariffWithTiers): TariffTier[] {
  return [...tariff.tiers].sort((a, b) => a.minDays - b.minDays);
}

/** Потолок срока аренды по тарифу — последняя ступень сетки. */
export function tariffMaxDays(tariff: TariffWithTiers): number {
  return tariff.tiers.reduce((max, t) => Math.max(max, t.maxDays), 0);
}

export function findTier(tariff: TariffWithTiers, days: number): TariffTier | undefined {
  return tariff.tiers.find((t) => days >= t.minDays && days <= t.maxDays);
}

/**
 * Проверка ступеней перед сохранением тарифа: цены положительные, ступени
 * начинаются с 1 дня и идут подряд без дыр и пересечений. Возвращает текст
 * ошибки для админки или null.
 */
export function validateTiers(
  tiers: { minDays: number; maxDays: number; priceSummer: number; priceWinter: number }[]
): string | null {
  if (tiers.length === 0) return "Добавьте хотя бы одну ступень";
  const sorted = [...tiers].sort((a, b) => a.minDays - b.minDays);
  let expectedMin = 1;
  for (const t of sorted) {
    if (!Number.isInteger(t.minDays) || !Number.isInteger(t.maxDays)) return "Дни — целые числа";
    if (t.minDays !== expectedMin) {
      return expectedMin === 1
        ? "Первая ступень должна начинаться с 1 дня"
        : `Ступени должны идти подряд: после ${expectedMin - 1} дней ожидается ступень с ${expectedMin}`;
    }
    if (t.maxDays < t.minDays) return `Ступень ${t.minDays}–${t.maxDays}: конец раньше начала`;
    if (t.priceSummer <= 0 || t.priceWinter <= 0) return `Ступень ${t.minDays}–${t.maxDays}: цена должна быть больше нуля`;
    expectedMin = t.maxDays + 1;
  }
  return null;
}

/** Дни аренды: как и раньше, округление вверх по разнице дат. */
export function rentalDays(start: Date, end: Date): number {
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export type QuoteError =
  | { error: "NO_TARIFF" }
  | { error: "MAX_DAYS_EXCEEDED"; maxDays: number };

export type Quote = {
  days: number;
  season: Season;
  tier: TariffTier;
  /** Цена за сутки по ступени и сезону. */
  pricePerDay: number;
  /** Итог аренды без депозита и надбавок. */
  totalPrice: number;
  /** Депозит: переопределение машины, иначе депозит тарифа. */
  deposit: number;
  /** Надбавка за отказ от депозита (0, если депозита нет). */
  withoutDeposit: number;
  tariff: {
    id: string;
    name: string;
    maxDays: number;
    tiers: { id: string; minDays: number; maxDays: number; pricePerDay: number }[];
  };
};

export function isQuoteError(q: Quote | QuoteError): q is QuoteError {
  return "error" in q;
}

type CarForQuote = { deposit: number; tariff: TariffWithTiers | null };

/**
 * Расчёт аренды машины на период. Ошибки — не исключения, а значения:
 * роуты переводят их в свои HTTP-ответы, а у машины без тарифа страница
 * каталога всё равно должна открыться.
 */
export async function quote(car: CarForQuote, start: Date, end: Date): Promise<Quote | QuoteError> {
  if (!car.tariff || !car.tariff.active || car.tariff.tiers.length === 0) {
    return { error: "NO_TARIFF" };
  }
  const days = rentalDays(start, end);
  const tier = findTier(car.tariff, days);
  if (!tier) {
    return { error: "MAX_DAYS_EXCEEDED", maxDays: tariffMaxDays(car.tariff) };
  }

  const season = seasonFor(start, await getSeasonBounds());
  const pricePerDay = tierPrice(tier, season);
  const deposit = car.deposit > 0 ? car.deposit : car.tariff.deposit;

  return {
    days,
    season,
    tier,
    pricePerDay,
    totalPrice: pricePerDay * days,
    deposit,
    withoutDeposit: deposit > 0 ? await noDepositSurcharge(deposit, days) : 0,
    tariff: {
      id: car.tariff.id,
      name: car.tariff.name,
      maxDays: tariffMaxDays(car.tariff),
      tiers: sortedTiers(car.tariff).map((t) => ({
        id: t.id,
        minDays: t.minDays,
        maxDays: t.maxDays,
        pricePerDay: tierPrice(t, season),
      })),
    },
  };
}

/**
 * Надбавка «без депозита»: депозит × процент по сроку × (1 + НДС).
 * За пределами настроенных диапазонов — последний процент плюс шаг за каждый
 * лишний день (`overflowDailyPercent`).
 */
export async function noDepositSurcharge(deposit: number, days: number): Promise<number> {
  const [surcharge, vatSetting] = await Promise.all([
    prisma.noDepositSurcharge.findFirst({ where: { minDay: { lte: days }, maxDay: { gte: days } } }),
    prisma.appSetting.findUnique({ where: { key: "vatPercent" } }),
  ]);
  const vat = Number(vatSetting?.value) || 0;

  let percent: number;
  if (surcharge) {
    percent = surcharge.percent;
  } else {
    const [last, step] = await Promise.all([
      prisma.noDepositSurcharge.findFirst({ orderBy: { maxDay: "desc" } }),
      prisma.appSetting.findUnique({ where: { key: "overflowDailyPercent" } }),
    ]);
    percent = (last?.percent ?? 0) + (Number(step?.value) || 0) * Math.max(0, days - (last?.maxDay ?? 0));
  }
  return Math.round((deposit * percent) / 100 * (1 + vat / 100));
}

/**
 * Витринная цена машины (`Car.pricePerDay`) для машины с тарифом — ступень
 * 1–2 дня текущего сезона. Каталог, фильтры и группировка читают это поле,
 * поэтому оно пересчитывается при привязке тарифа и в синке инвентаря.
 */
export function displayPrice(tariff: TariffWithTiers, bounds: SeasonBounds, now = new Date()): number | null {
  const first = sortedTiers(tariff)[0];
  return first ? tierPrice(first, seasonFor(now, bounds)) : null;
}

/** Пересчёт витринной цены у всех машин тарифа (после правки тарифа или привязки). */
export async function refreshDisplayPrices(tariffId: string): Promise<void> {
  const tariff = await prisma.tariff.findUnique({ where: { id: tariffId }, include: { tiers: true } });
  if (!tariff) return;
  const price = displayPrice(tariff, await getSeasonBounds());
  if (price == null) return;
  await prisma.car.updateMany({ where: { tariffId }, data: { pricePerDay: price } });
}

/** Витринные цены всех машин с тарифом — вызывается синком инвентаря ради смены сезона. */
export async function refreshAllDisplayPrices(): Promise<void> {
  const [tariffs, bounds] = await Promise.all([
    prisma.tariff.findMany({ include: { tiers: true } }),
    getSeasonBounds(),
  ]);
  for (const tariff of tariffs) {
    const price = displayPrice(tariff, bounds);
    if (price == null) continue;
    await prisma.car.updateMany({
      where: { tariffId: tariff.id, pricePerDay: { not: price } },
      data: { pricePerDay: price },
    });
  }
}
