import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cars, blogPosts] = await Promise.all([
    prisma.car.findMany({
      where: { status: "AVAILABLE" },
      select: { slug: true, updatedAt: true },
    }),
    prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const locales = ["ru", "kz"];
  const baseUrl = "https://qazqar.kz";

  const staticPages = ["", "/catalog", "/about", "/faq", "/terms", "/blog"];

  const staticEntries = staticPages.flatMap((page) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: page === "" ? ("daily" as const) : ("weekly" as const),
      priority: page === "" ? 1 : page === "/catalog" ? 0.9 : 0.7,
    }))
  );

  const carEntries = cars.flatMap((car) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}/catalog/${car.slug}`,
      lastModified: car.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }))
  );

  const blogEntries = blogPosts.flatMap((post) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }))
  );

  return [...staticEntries, ...carEntries, ...blogEntries];
}
