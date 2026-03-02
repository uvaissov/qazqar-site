"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { type Locale } from "@/i18n/config";

export default function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  function switchLocale(newLocale: Locale) {
    router.replace(pathname, { locale: newLocale });
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => switchLocale("ru")}
        className={`px-2 py-1 text-sm font-medium rounded transition-colors ${
          locale === "ru"
            ? "bg-cyan-500 text-white"
            : "text-gray-600 hover:text-cyan-500"
        }`}
      >
        RU
      </button>
      <span className="text-gray-300">|</span>
      <button
        onClick={() => switchLocale("kz")}
        className={`px-2 py-1 text-sm font-medium rounded transition-colors ${
          locale === "kz"
            ? "bg-cyan-500 text-white"
            : "text-gray-600 hover:text-cyan-500"
        }`}
      >
        KZ
      </button>
    </div>
  );
}
