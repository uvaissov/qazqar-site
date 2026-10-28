import { pageAlternates } from "@/lib/seo";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getFaqItems } from "@/lib/data/content";
import FaqSection from "@/components/home/FaqSection";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("faq");
  return {
    alternates: pageAlternates(locale, "/faq"),
    openGraph: { title: `${t("title")} | Qazqar`, description: t("sectionTitle"), url: `/${locale}/faq` },
    twitter: { title: `${t("title")} | Qazqar`, description: t("sectionTitle") },
    title: `${t("title")} | Qazqar`,
    description: t("sectionTitle"),
  };
}

export default async function FaqPage() {
  const t = await getTranslations("faq");
  const faqItems = await getFaqItems();

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Page header */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
          <p className="mt-2 text-gray-600">{t("sectionTitle")}</p>
        </div>
      </section>

      {/* FAQ accordion — reuse home section component */}
      <FaqSection faqItems={faqItems} />
    </main>
  );
}
