import type { Metadata } from "next";
import RentalServicePage, { rentalServices } from "@/components/catalog/RentalServicePage";
import { pageAlternates } from "@/lib/seo";
type Params = Promise<{ locale: string }>;
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const config = rentalServices.month;
  const text = locale === "kz" ? config.kz : config.ru;
  return { title: `${text.title} | Qazqar`, description: text.description, alternates: pageAlternates(locale, config.path), openGraph: { url: `/${locale}${config.path}`, title: text.title, description: text.description } };
}
export default async function Page({ params }: { params: Params }) {
  const { locale } = await params;
  return <RentalServicePage locale={locale} service="month" />;
}
