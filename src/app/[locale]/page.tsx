import type { Metadata } from "next";
import { pageAlternates } from "@/lib/seo";
import { businessData } from "@/lib/business";
import { getPublicModels } from "@/lib/data/models";
import ModelLinks from "@/components/catalog/ModelLinks";
import { getGroupedCars } from "@/lib/data/cars";
import { getReviews, getFaqItems } from "@/lib/data/content";
import JsonLd from "@/components/seo/JsonLd";
import HeroSection from "@/components/home/HeroSection";
import CarsSection from "@/components/home/CarsSection";
import StepsSection from "@/components/home/StepsSection";
import AboutSection from "@/components/home/AboutSection";
import ReviewsSection from "@/components/home/ReviewsSection";
import FaqSection from "@/components/home/FaqSection";
import ScrollToTop from "@/components/ui/ScrollToTop";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const prices = (await getGroupedCars()).filter(car => car.tariff?.active && car.tariff.tiers.length).map(car => car.pricePerDay).filter(price => price > 0);
  const price = prices.length ? Math.min(...prices).toLocaleString(locale === "kz" ? "kk-KZ" : "ru-RU") : null;
  const title = locale === "kz" ? "Астанада жүргізушісіз автокөлік жалдау | Qazqar" : "Аренда авто в Астане без водителя | Qazqar";
  const description = locale === "kz"
    ? `Астанада автокөлік жалдау${price ? `: тәулігіне ${price} ₸-ден` : ""}. Күндеріңізге тарифті есептеңіз. Дінмұхамед Қонаев көшесі, 2. Каталогтан қолжетімді автокөлікті таңдаңыз.`
    : `Аренда автомобилей в Астане без водителя${price ? ` от ${price} ₸/сутки` : ""}. Расчёт на ваши даты, выдача на Динмухамед Конаев, 2. Выберите свободный автомобиль в каталоге.`;
  return { title, description, alternates: pageAlternates(locale), openGraph: { title, description, url: `/${locale}`, images: [{ url: "/images/logo.png" }] }, twitter: { card: "summary", title, description } };
}

export default async function HomePage() {
  const [cars, reviews, faqItems, models] = await Promise.all([
    getGroupedCars(),
    getReviews(),
    getFaqItems(),
    getPublicModels(),
  ]);

  const prices = cars.filter(car => car.tariff?.active && car.tariff.tiers.length).map(car => car.pricePerDay).filter(price => price > 0);
  const minPrice = prices.length ? Math.min(...prices) : null;

  return (
    <>
      <JsonLd data={businessData()} />
      <main>
        <HeroSection minPrice={minPrice} />
        <CarsSection cars={cars} />
        <ModelLinks models={models} />
        <StepsSection />
        <AboutSection />
        <ReviewsSection reviews={reviews} />
        <FaqSection faqItems={faqItems} />
        <ScrollToTop />
      </main>
    </>
  );
}
