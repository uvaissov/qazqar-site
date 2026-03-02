import { getTranslations } from "next-intl/server";
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

export default async function CatalogGrid({ cars }: { cars: CarWithModel[] }) {
  const t = await getTranslations("catalogPage");

  if (cars.length === 0) {
    return (
      <div className="text-center py-16">
        <svg
          className="mx-auto h-16 w-16 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">
          {t("emptyTitle")}
        </h3>
        <p className="mt-2 text-gray-500">{t("emptyDescription")}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Count */}
      <p className="mb-4 text-sm text-gray-600">
        {t("found")}: {cars.length} {t("carsCount")}
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cars.map((car) => (
          <CarCard key={car.id} car={car} />
        ))}
      </div>
    </div>
  );
}
