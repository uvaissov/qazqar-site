import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { mkdirSync, writeFileSync } from "node:fs";
import { describe, it, expect, vi } from "vitest";
import ru from "@/i18n/messages/ru.json";
import kz from "@/i18n/messages/kz.json";

const state = vi.hoisted(() => ({ locale: "ru", model: vi.fn(), car: vi.fn(), grouped: vi.fn() }));
vi.mock("@/lib/data/models", () => ({ getPublicModel: state.model }));
vi.mock("@/lib/data/cars", () => ({ getCarBySlug: state.car, getSimilarCars: async () => [], getCarImages: () => [], getGroupedCars: state.grouped }));
vi.mock("@/lib/pricing", async importOriginal => ({ ...await importOriginal<typeof import("@/lib/pricing")>(), getSeasonBounds: async () => ({ summerFrom: 1, summerTo: 12 }) }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("404"); }, permanentRedirect: (url: string) => { throw new Error(`redirect:${url}`); } }));
vi.mock("@/components/car/BookingForm", () => ({ default: () => React.createElement("div", { className: "rounded-2xl border bg-white p-5" }, "Полное бронирование") }));
vi.mock("@/lib/data/content", () => ({ getBlogPostBySlug: async () => ({ titleRu: "Russian", titleKz: "", contentRu: "Russian article", contentKz: "", slug: "ru-only" }) }));
vi.mock("@/i18n/routing", () => ({ Link: (props: React.ComponentProps<"a">) => React.createElement("a", props) }));
vi.mock("next/link", () => ({ default: (props: React.ComponentProps<"a">) => React.createElement("a", props) }));
vi.mock("next/image", () => ({ default: ({ fill, priority, ...props }: React.ComponentProps<"img"> & { fill?: boolean; priority?: boolean }) => React.createElement("img", { ...props, loading: priority ? "eager" : "lazy", style: fill ? { width: "100%", height: "100%", objectFit: "cover" } : undefined }) }));

function translations(namespace: string) {
  const messages = state.locale === "kz" ? kz : ru;
  const entries = messages[namespace as keyof typeof messages] as Record<string, string>;
  return (key: string, values: Record<string, unknown> = {}) => (entries?.[key] || key).replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? ""));
}
vi.mock("next-intl/server", () => ({ getLocale: async () => state.locale, getTranslations: async (namespace: string) => translations(namespace), setRequestLocale: () => {} }));
vi.mock("next-intl", () => ({ useLocale: () => state.locale, useTranslations: (namespace: string) => translations(namespace) }));

import ModelPage, { generateMetadata as modelMetadata } from "@/app/[locale]/(public)/cars/[slug]/page";
import CarPage from "@/app/[locale]/(public)/catalog/[slug]/page";
import { generateMetadata as blogMetadata } from "@/app/[locale]/(public)/blog/[slug]/page";
import RentalServicePage from "@/components/catalog/RentalServicePage";
import Footer from "@/components/layout/Footer";

const tariff = { id: "tariff", name: "Elantra", active: true, deposit: 30000, createdAt: new Date(), updatedAt: new Date(), tiers: [
  { id: "short", tariffId: "tariff", minDays: 1, maxDays: 2, priceSummer: 25000, priceWinter: 24000 },
  { id: "long", tariffId: "tariff", minDays: 3, maxDays: 30, priceSummer: 17000, priceWinter: 16000 },
] };
const car = { id: "car", slug: "elantra-1", year: 2024, color: "Белый", pricePerDay: 25000, status: "RENTED", model: { name: "Elantra", slug: "elantra", brand: { name: "Hyundai" } }, photos: [], tariff, deposit: 30000, descriptionRu: "", descriptionKz: "", transmission: "AUTOMATIC", fuelType: "AI92", seats: 5, hasAC: true, availableFrom: null, nextBookingAt: null };
state.car.mockResolvedValue(car);
state.model.mockResolvedValue({ name: "Elantra", slug: "elantra", brand: { name: "Hyundai" }, cars: [car] });
state.grouped.mockResolvedValue([car]);

async function resolveServer(node: React.ReactNode): Promise<React.ReactNode> {
  if (Array.isArray(node)) return Promise.all(node.map(resolveServer));
  if (!React.isValidElement<{ children?: React.ReactNode }>(node)) return node;
  if (typeof node.type === "function" && node.type.constructor.name === "AsyncFunction") {
    return resolveServer(await (node.type as (props: unknown) => Promise<React.ReactNode>)(node.props));
  }
  if (node.props.children !== undefined) return React.cloneElement(node, undefined, await resolveServer(node.props.children));
  return node;
}
async function html(node: React.ReactNode) { return renderToStaticMarkup(await resolveServer(node)); }
function schemas(markup: string) { return [...markup.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map(match => JSON.parse(match[1])); }

describe("SEO page rendering", () => {
  it("keeps the model page useful when every car is rented and links to the booking selection", async () => {
    state.locale = "ru";
    const markup = await html(await ModelPage({ params: Promise.resolve({ locale: "ru", slug: "elantra" }) }));
    expect(markup).toContain("Сейчас свободно");
    expect(markup).toContain("/catalog/elantra-1");
    expect(markup).not.toContain("wa.me");
    expect(schemas(markup).find(schema => schema["@type"] === "BreadcrumbList")).toBeDefined();
    const metadata = await modelMetadata({ params: Promise.resolve({ locale: "ru", slug: "elantra" }) });
    expect(metadata.alternates?.canonical).toBe("/ru/cars/elantra");
    if (process.env.SEO_PREVIEW_DIR) {
      mkdirSync(process.env.SEO_PREVIEW_DIR, { recursive: true });
      writeFileSync(`${process.env.SEO_PREVIEW_DIR}/model.html`, `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body>${markup}${renderToStaticMarkup(<Footer />)}</body></html>`);
    }
  });
  it("uses the one-day seasonal tariff and marks a rented car unavailable", async () => {
    state.locale = "ru";
    const markup = await html(await CarPage({ params: Promise.resolve({ locale: "ru", slug: "elantra-1" }), searchParams: Promise.resolve({}) }));
    const product = schemas(markup).find(schema => schema["@type"] === "Product");
    expect(product.offers.price).toBe(25000);
    expect(product.offers.availability).toBe("https://schema.org/OutOfStock");
  });
  it("shows the actual 30-day rental subtotal and states that deposit is separate", async () => {
    state.locale = "ru";
    const markup = await html(await RentalServicePage({ locale: "ru", service: "month" }));
    expect(markup.replace(/\D/g, "")).toContain("510000");
    expect(markup).toContain("депозит и надбавки отдельно");
  });
  it("renders the Kazakh landing page and redirects an untranslated article to Russian", async () => {
    state.locale = "kz";
    const markup = await html(await ModelPage({ params: Promise.resolve({ locale: "kz", slug: "elantra" }) }));
    expect(markup).toContain("Астанада Hyundai Elantra жалдау");
    expect(markup).not.toContain("wa.me");
    await expect(blogMetadata({ params: Promise.resolve({ locale: "kz", slug: "ru-only" }) })).rejects.toThrow("redirect:/p/ru-only");
  });
});
