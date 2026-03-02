import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import CarCard from "@/components/ui/CarCard";
import type { Transmission } from "@/generated/prisma/enums";

type CarWithModel = {
  id: string;
  slug: string;
  year: number;
  color: string;
  pricePerDay: number;
  transmission: Transmission;
  seats: number;
  hasAC: boolean;
  images: string[];
  model: {
    name: string;
    brand: {
      name: string;
    };
  };
};

export default async function CarsSection({
  cars,
}: {
  cars: CarWithModel[];
}) {
  const t = await getTranslations("catalog");
  const tNav = await getTranslations("nav");

  const displayCars = cars.slice(0, 6);

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            {t("title")}
          </h2>
          <p className="text-gray-600 mt-2">{t("subtitle")}</p>
          <p className="text-gray-500 mt-2 max-w-2xl mx-auto">
            {t("description")}
          </p>
        </div>

        {/* Cars grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayCars.map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>

        {/* View all link */}
        {cars.length > 6 && (
          <div className="text-center mt-12">
            <Link
              href="/catalog"
              className="inline-flex items-center px-6 py-3 border-2 border-cyan-500 text-cyan-500 font-semibold rounded-xl hover:bg-cyan-500 hover:text-white transition-colors"
            >
              {tNav("catalog")}
              <svg
                className="w-5 h-5 ml-2"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
