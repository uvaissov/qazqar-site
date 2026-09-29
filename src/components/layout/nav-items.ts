import { blogPath } from "@/lib/blog-url";

// Готовые href с локалью: блог (ru) живёт вне /ru — см. src/lib/blog-url.ts,
// поэтому пункты рендерятся обычным next/link, а не локализующим Link из next-intl.
export function getNavItems(locale: string) {
  return [
    { key: "home", href: `/${locale}` },
    { key: "about", href: `/${locale}#about` },
    { key: "reviews", href: `/${locale}#reviews` },
    { key: "terms", href: `/${locale}#faq` },
    { key: "blog", href: blogPath(locale) },
  ] as const;
}
