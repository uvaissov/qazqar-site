import { getTranslations } from "next-intl/server";
import CarCard from "@/components/ui/CarCard";
import type { Transmission } from "@/generated/prisma/enums";

type CarWithModel = {
  id: string;
  slug: string;
  year: number;
  color: string;
  transmission: Transmission;
  seats: number;
  hasAC: boolean;
  photos: { photo: { url: string } }[];
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
    <section className="mt-20 pt-16 border-t border-gray-200/50">
      <div className="flex items-center gap-4 mb-8">
         <div className="h-8 w-2 bg-cyan-500 rounded-full" />
         <h2 className="text-3xl font-black text-gray-900 tracking-tight">
           {t("similarCars")}
         </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {cars.map((car) => (
          <CarCard key={car.id} car={car} />
        ))}
      </div>
    </section>
  );
}
