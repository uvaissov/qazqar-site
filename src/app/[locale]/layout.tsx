import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { type Locale } from "@/i18n/config";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import "../globals.css";

export const metadata: Metadata = {
  title: "Qazqar | Прокат автомобилей без водителей в Астане",
  description:
    "Широкий ассортимент автомобилей и самые доступные цены по всему городу Астана. Аренда от 14 000 ₸/сутки.",
};

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
