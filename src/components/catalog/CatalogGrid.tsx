import { getTranslations } from "next-intl/server";
import CarCard from "@/components/ui/CarCard";
import type { Transmission } from "@/generated/prisma/enums";
import { SearchX } from "lucide-react";

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
      <div className="text-center py-24 glass rounded-[3rem] mt-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gray-50 text-gray-300 mb-6">
           <SearchX size={40} />
        </div>
        <h3 className="text-2xl font-black text-gray-900">
          {t("emptyTitle")}
        </h3>
        <p className="mt-2 text-gray-500 max-w-sm mx-auto">
          {t("emptyDescription")}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {cars.map((car) => (
          <CarCard key={car.id} car={car} />
        ))}
      </div>
    </div>
  );
}
