"use client";

import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { blogPath } from "@/lib/blog-url";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const path = pathname.replace(/^\/(ru|kz)(?=\/|$)/, "");
  const blog = /^(?:\/p|\/blog)(?:\/(.*))?$/.exec(path);
  const href = (language: string) => blog ? blogPath(language, blog[1]) : `/${language}${path}`;
  return (
    <div className="flex items-center gap-1">
      {["ru", "kz"].map(language => <Link key={language} href={href(language)} hrefLang={language === "kz" ? "kk" : "ru"} aria-current={locale === language ? "page" : undefined} className={`px-2 py-1 text-sm font-medium rounded transition-colors ${locale === language ? "bg-cyan-500 text-white" : "text-gray-600 hover:text-cyan-500"}`}>{language.toUpperCase()}</Link>)}
    </div>
  );
}
