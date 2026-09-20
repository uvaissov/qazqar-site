import { describe, expect, test, vi } from "vitest";

// pricing.ts тянет prisma ради quote/getSeasonBounds; чистые функции
// проверяются без базы, клиент подменяется пустышкой.
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import {
  displayPrice,
  findTier,
  rentalDays,
  seasonFor,
  tariffMaxDays,
  validateTiers,
  type TariffWithTiers,
} from "./pricing";

const tier = (minDays: number, maxDays: number, priceSummer: number, priceWinter: number) => ({
  id: `t${minDays}`,
  tariffId: "tariff",
  minDays,
  maxDays,
  priceSummer,
  priceWinter,
});

// Hyundai Accent 2017 из прайс-листа
const accent: TariffWithTiers = {
  id: "tariff",
  name: "Hyundai Accent 2017",
  deposit: 50000,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  tiers: [tier(6, 15, 12500, 12000), tier(1, 2, 15000, 15000), tier(16, 30, 11000, 11000), tier(3, 5, 14000, 14000)],
};

const bounds = { summerFrom: 5, summerTo: 10 };

describe("seasonFor", () => {
  test("май–октябрь включительно — лето, остальное — зима", () => {
    expect(seasonFor(new Date("2026-05-01T05:00:00+05:00"), bounds)).toBe("summer");
    expect(seasonFor(new Date("2026-10-31T23:00:00+05:00"), bounds)).toBe("summer");
    expect(seasonFor(new Date("2026-11-01T09:00:00+05:00"), bounds)).toBe("winter");
    expect(seasonFor(new Date("2026-04-30T09:00:00+05:00"), bounds)).toBe("winter");
  });

  test("месяц берётся по Астане: 1 мая 00:30 местного — уже лето, хотя по UTC ещё апрель", () => {
    expect(seasonFor(new Date("2026-05-01T00:30:00+05:00"), bounds)).toBe("summer");
  });

  test("лето через Новый год (от > до) считается циклически", () => {
    const winterBounds = { summerFrom: 11, summerTo: 2 };
    expect(seasonFor(new Date("2026-12-15T09:00:00+05:00"), winterBounds)).toBe("summer");
    expect(seasonFor(new Date("2026-06-15T09:00:00+05:00"), winterBounds)).toBe("winter");
  });
});

describe("findTier / tariffMaxDays", () => {
  test("ступень по числу дней, границы включительно", () => {
    expect(findTier(accent, 1)?.minDays).toBe(1);
    expect(findTier(accent, 2)?.minDays).toBe(1);
    expect(findTier(accent, 3)?.minDays).toBe(3);
    expect(findTier(accent, 15)?.minDays).toBe(6);
    expect(findTier(accent, 16)?.minDays).toBe(16);
    expect(findTier(accent, 30)?.minDays).toBe(16);
  });

  test("за пределами сетки ступени нет — аренда дольше 30 дней невозможна", () => {
    expect(findTier(accent, 31)).toBeUndefined();
    expect(tariffMaxDays(accent)).toBe(30);
  });
});

describe("displayPrice", () => {
  test("витринная цена — ступень 1–2 дня текущего сезона", () => {
    const changan: TariffWithTiers = { ...accent, tiers: [tier(1, 2, 22000, 25000), tier(3, 5, 20000, 22500)] };
    expect(displayPrice(changan, bounds, new Date("2026-07-01T09:00:00+05:00"))).toBe(22000);
    expect(displayPrice(changan, bounds, new Date("2026-12-01T09:00:00+05:00"))).toBe(25000);
  });
});

describe("rentalDays", () => {
  test("округление вверх, как в старом расчёте", () => {
    expect(rentalDays(new Date("2026-09-21T09:00:00+05:00"), new Date("2026-09-22T09:00:00+05:00"))).toBe(1);
    expect(rentalDays(new Date("2026-09-21T09:00:00+05:00"), new Date("2026-09-22T10:00:00+05:00"))).toBe(2);
  });
});

describe("validateTiers", () => {
  const ok = accent.tiers.map(({ minDays, maxDays, priceSummer, priceWinter }) => ({ minDays, maxDays, priceSummer, priceWinter }));

  test("сетка из прайс-листа проходит", () => {
    expect(validateTiers(ok)).toBeNull();
  });

  test("дыра между ступенями", () => {
    const gap = ok.map((t) => (t.minDays === 16 ? { ...t, minDays: 17 } : t));
    expect(validateTiers(gap)).toMatch(/подряд/);
  });

  test("пересечение «15-30» после «6-15» — ошибка, а не молчаливое исправление", () => {
    const overlap = ok.map((t) => (t.minDays === 16 ? { ...t, minDays: 15 } : t));
    expect(validateTiers(overlap)).toMatch(/подряд/);
  });

  test("первая ступень не с первого дня", () => {
    expect(validateTiers(ok.filter((t) => t.minDays !== 1))).toMatch(/с 1 дня/);
  });

  test("нулевая цена и пустой список", () => {
    expect(validateTiers(ok.map((t) => ({ ...t, priceWinter: 0 })))).toMatch(/больше нуля/);
    expect(validateTiers([])).toMatch(/хотя бы одну/);
  });
});
