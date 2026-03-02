import { getCars } from "@/lib/data/cars";
import { getDiscounts, getReviews, getFaqItems } from "@/lib/data/content";
import JsonLd from "@/components/seo/JsonLd";
import HeroSection from "@/components/home/HeroSection";
import CarsSection from "@/components/home/CarsSection";
import StepsSection from "@/components/home/StepsSection";
import AboutSection from "@/components/home/AboutSection";
import DiscountsSection from "@/components/home/DiscountsSection";
import ReviewsSection from "@/components/home/ReviewsSection";
import FaqSection from "@/components/home/FaqSection";

export default async function HomePage() {
  const [cars, discounts, reviews, faqItems] = await Promise.all([
    getCars(),
    getDiscounts(),
    getReviews(),
    getFaqItems(),
  ]);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: "Qazqar",
          description: "Прокат автомобилей без водителей в Астане",
          url: "https://qazqar.kz",
          telephone: "+77763504141",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Астана",
            addressCountry: "KZ",
          },
          openingHours: "Mo-Su 09:00-21:00",
          priceRange: "₸₸",
        }}
      />
      <main>
        <HeroSection />
        <CarsSection cars={cars} />
        <StepsSection />
        <AboutSection />
        {discounts.length > 0 && <DiscountsSection discounts={discounts} />}
        <ReviewsSection reviews={reviews} />
        <FaqSection faqItems={faqItems} />
      </main>
    </>
  );
}
