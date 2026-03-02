import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { type Locale } from "@/i18n/config";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import "../globals.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title:
      locale === "kz"
        ? "Qazqar | Астанада жүргізушісіз автокөлік жалға беру"
        : "Qazqar | Прокат автомобилей без водителей в Астане",
    description:
      locale === "kz"
        ? "Астана қаласы бойынша автокөліктердің кең ассортименті және қолжетімді бағалар. Тәулігіне 14 000 ₸-ден жалға алу."
        : "Широкий ассортимент автомобилей и самые доступные цены по всему городу Астана. Аренда от 14 000 ₸/сутки.",
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

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="antialiased">
        <NextIntlClientProvider messages={messages}>
          <LayoutWrapper>{children}</LayoutWrapper>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
