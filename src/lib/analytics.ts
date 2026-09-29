import type { Metadata } from "next";

// Читается в рантайме (layout — force-dynamic), поэтому без NEXT_PUBLIC_ и без
// пересборки: поменял /opt/qazqar/.env → перезапустил контейнер.
const ID_PATTERNS = {
  gtmId: /^GTM-[A-Z0-9]+$/,
  gaId: /^G-[A-Z0-9]+$/,
  yandexMetrikaId: /^\d+$/,
} as const;

export interface AnalyticsIds {
  gtmId?: string;
  gaId?: string;
  yandexMetrikaId?: string;
}

function envId(name: string, pattern: RegExp): string | undefined {
  const value = process.env[name]?.trim();
  return value && pattern.test(value) ? value : undefined;
}

export function getAnalyticsIds(): AnalyticsIds {
  return {
    gtmId: envId("GTM_ID", ID_PATTERNS.gtmId),
    gaId: envId("GA_MEASUREMENT_ID", ID_PATTERNS.gaId),
    yandexMetrikaId: envId("YANDEX_METRIKA_ID", ID_PATTERNS.yandexMetrikaId),
  };
}

/** meta-теги подтверждения прав в Google Search Console и Яндекс.Вебмастере */
export function getSiteVerification(): Metadata["verification"] {
  const google = process.env.GOOGLE_SITE_VERIFICATION?.trim();
  const yandex = process.env.YANDEX_VERIFICATION?.trim();
  if (!google && !yandex) return undefined;
  return {
    ...(google && { google }),
    ...(yandex && { yandex }),
  };
}
