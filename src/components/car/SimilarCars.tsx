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

type SimilarCarsProps = {
  cars: CarWithModel[];
};

export default async function SimilarCars({ cars }: SimilarCarsProps) {
  const t = await getTranslations("carDetail");

  if (cars.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {t("similarCars")}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cars.map((car) => (
          <CarCard key={car.id} car={car} />
        ))}
      </div>
    </section>
  );
}
