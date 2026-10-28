import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { hasKazakhTranslation, pageAlternates } from "./seo";
import JsonLd from "@/components/seo/JsonLd";

const db = vi.hoisted(() => ({
  car: { findMany: vi.fn() }, carModel: { findMany: vi.fn() }, blogPost: { findMany: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.stubGlobal("React", React);
import sitemap from "@/app/sitemap";

describe("public SEO", () => {
  beforeEach(() => {
    db.car.findMany.mockResolvedValue([{ slug: "rented-car" }]);
    db.carModel.findMany.mockResolvedValue([{ slug: "elantra" }]);
    db.blogPost.findMany.mockResolvedValue([
      { slug: "ru-only", titleKz: "", contentKz: "", contentRu: "Russian", updatedAt: new Date("2026-09-01") },
      { slug: "translated", titleKz: "Қазақша", contentKz: "Мақала", contentRu: "Russian", updatedAt: new Date("2026-09-02") },
      { slug: "copied", titleKz: "Russian", contentKz: "Russian", contentRu: "Russian", updatedAt: new Date("2026-09-03") },
    ]);
  });
  it("connects language counterparts and canonicalizes date/filter URLs to the clean page", () => {
    expect(pageAlternates("kz", "/catalog")).toEqual({ canonical: "/kz/catalog", languages: { ru: "/ru/catalog", kk: "/kz/catalog", "x-default": "/ru/catalog" } });
  });
  it("rejects empty markup and copied Russian content as a Kazakh translation", () => {
    expect(hasKazakhTranslation({ titleKz: "Title", contentKz: "<p>&nbsp;</p>" })).toBe(false);
    expect(hasKazakhTranslation({ titleKz: "Title", contentKz: "<p>Same</p>", contentRu: "Same" })).toBe(false);
    expect(hasKazakhTranslation({ titleKz: "Қазақша", contentKz: "Мақала", contentRu: "Статья" })).toBe(true);
  });
  it("keeps rented cars discoverable, excludes untranslated alternates and does not invent modification dates", async () => {
    const entries = await sitemap();
    expect(db.car.findMany).toHaveBeenCalledWith({ where: { isArchived: false, isHidden: false }, select: { slug: true } });
    expect(entries.some(entry => entry.url === "https://qazqar.kz/ru/catalog/rented-car")).toBe(true);
    expect(entries.some(entry => entry.url === "https://qazqar.kz/ru/cars/elantra")).toBe(true);
    expect(entries.some(entry => entry.url === "https://qazqar.kz/kz/blog/translated")).toBe(true);
    expect(entries.some(entry => entry.url === "https://qazqar.kz/kz/blog/ru-only")).toBe(false);
    expect(entries.some(entry => entry.url === "https://qazqar.kz/kz/blog/copied")).toBe(false);
    expect(entries.find(entry => entry.url === "https://qazqar.kz/ru")?.lastModified).toBeUndefined();
    expect(entries.find(entry => entry.url === "https://qazqar.kz/p/ru-only")?.alternates?.languages).not.toHaveProperty("kk");
  });
  it("serializes JSON-LD safely without corrupting values containing HTML", () => {
    const data = { name: "</script><img src=x>", description: "Цена < 20000" };
    const html = renderToStaticMarkup(<JsonLd data={data} />);
    expect(html.match(/<\/script>/g)).toHaveLength(1);
    expect(JSON.parse(html.replace(/^<script[^>]*>/, "").replace(/<\/script>$/, ""))).toEqual(data);
  });
});
