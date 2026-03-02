import { getCars } from "@/lib/data/cars";
import { getDiscounts, getReviews, getFaqItems } from "@/lib/data/content";
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
    <main>
      <HeroSection />
      <CarsSection cars={cars} />
      <StepsSection />
      <AboutSection />
      {discounts.length > 0 && <DiscountsSection discounts={discounts} />}
      <ReviewsSection reviews={reviews} />
      <FaqSection faqItems={faqItems} />
    </main>
  );
}
