import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { PUBLIC_CAR_WHERE } from "@/lib/data/cars";
import { blogPath } from "@/lib/blog-url";
import { hasKazakhTranslation, SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cars, models, posts] = await Promise.all([
    prisma.car.findMany({ where: PUBLIC_CAR_WHERE, select: { slug: true } }),
    prisma.carModel.findMany({ where: { cars: { some: {} } }, select: { slug: true } }),
    prisma.blogPost.findMany({ where: { published: true }, select: { slug: true, updatedAt: true, titleKz: true, contentKz: true, contentRu: true } }),
  ]);
  const entries: MetadataRoute.Sitemap = [];
  const localized = (path: string) => {
    const languages = { ru: `${SITE_URL}/ru${path}`, kk: `${SITE_URL}/kz${path}`, "x-default": `${SITE_URL}/ru${path}` };
    for (const locale of ["ru", "kz"]) entries.push({ url: `${SITE_URL}/${locale}${path}`, alternates: { languages } });
  };
  for (const path of ["", "/catalog", "/about", "/faq", "/terms", "/rent-month", "/rent-without-deposit"]) localized(path);
  for (const model of models) localized(`/cars/${model.slug}`);
  // Rented cars remain discoverable. Sync timestamps are not content revision dates.
  for (const car of cars) localized(`/catalog/${car.slug}`);
  for (const locale of ["ru", "kz"]) entries.push({ url: `${SITE_URL}${blogPath(locale)}`, alternates: { languages: { ru: `${SITE_URL}${blogPath("ru")}`, kk: `${SITE_URL}${blogPath("kz")}` } } });
  for (const post of posts) {
    const translated = hasKazakhTranslation(post);
    const languages = { ru: `${SITE_URL}${blogPath("ru", post.slug)}`, ...(translated && { kk: `${SITE_URL}${blogPath("kz", post.slug)}` }) };
    for (const locale of translated ? ["ru", "kz"] : ["ru"]) entries.push({ url: `${SITE_URL}${blogPath(locale, post.slug)}`, lastModified: post.updatedAt, alternates: { languages } });
  }
  return entries;
}
