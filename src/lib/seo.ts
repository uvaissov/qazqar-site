import type { Metadata } from "next";

export const SITE_URL = "https://qazqar.kz";
export const localeLanguage = (locale: string) => locale === "kz" ? "kk" : "ru";
export const localizedPath = (locale: string, path = "") => `/${locale}${path}`;

export function pageAlternates(locale: string, path = ""): Metadata["alternates"] {
  return {
    canonical: localizedPath(locale, path),
    languages: {
      ru: localizedPath("ru", path),
      kk: localizedPath("kz", path),
      "x-default": localizedPath("ru", path),
    },
  };
}

export const privateMetadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: { canonical: null, languages: {} },
};

export function hasKazakhTranslation(post: { titleKz: string; contentKz: string; titleRu?: string; contentRu?: string }) {
  const text = (value: string) => value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  return Boolean(text(post.titleKz) && text(post.contentKz)) &&
    (!post.contentRu || text(post.contentKz) !== text(post.contentRu));
}

export function breadcrumbData(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem", position: index + 1, name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
