import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/cabinet/"],
      },
    ],
    sitemap: "https://qazqar.kz/sitemap.xml",
  };
}
