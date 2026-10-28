import { localeLanguage } from "@/lib/seo";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { type Locale } from "@/i18n/config";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import Analytics from "@/components/seo/Analytics";
import { getAnalyticsIds, getSiteVerification } from "@/lib/analytics";
import "../globals.css";

// Приложение динамическое: авторизация + живые данные из CRM-синка. Отключаем
// статический пререндер (иначе сборка падает на обращении к БД на этапе
// "Generating static pages"). Применяется каскадом ко всем [locale]-страницам.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isKz = locale === "kz";

  const title = isKz
    ? "Qazqar | Астанада жүргізушісіз автокөлік жалға беру"
    : "Qazqar | Прокат автомобилей без водителей в Астане";
  const description = isKz
    ? "Астана қаласы бойынша автокөліктердің кең ассортименті және қолжетімді бағалар. Тарифті өз күндеріңізге есептеңіз."
    : "Широкий ассортимент автомобилей и самые доступные цены по всему городу Астана. Рассчитайте аренду на ваши даты.";

  return {
    metadataBase: new URL("https://qazqar.kz"),
    title,
    description,
    keywords: isKz
      ? ["автокөлік жалға беру", "Астана", "прокат", "жүргізушісіз", "Qazqar"]
      : ["аренда авто", "Астана", "прокат автомобилей", "без водителя", "Qazqar"],
    openGraph: {
      title,
      description,
      siteName: "Qazqar",
      locale: isKz ? "kk_KZ" : "ru_RU",
      type: "website",
      url: `https://qazqar.kz/${locale}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },

    verification: getSiteVerification(),
    other: {
      "theme-color": "#06b6d4",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }
  // Блог на /p/* приходит rewrite'ом мимо middleware next-intl (src/lib/blog-url.ts),
  // поэтому локаль из сегмента задаём явно.
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={localeLanguage(locale)}>
      <body className="antialiased">
        <NextIntlClientProvider messages={messages}>
          <LayoutWrapper>{children}</LayoutWrapper>
        </NextIntlClientProvider>
        <div id="datepicker-portal" />
        <Analytics {...getAnalyticsIds()} />
      </body>
    </html>
  );
}
