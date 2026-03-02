import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import CarCard from "@/components/ui/CarCard";
import type { Transmission } from "@/generated/prisma/enums";
import { ArrowRight, Sparkles } from "lucide-react";

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
    <section className="py-24 md:py-32 bg-white relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-50 rounded-full blur-3xl -mr-40 -mt-40" />
      
      <div className="max-w-7xl mx-auto px-4 relative">
        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-50 text-cyan-600 text-sm font-black uppercase tracking-widest mb-4">
               <Sparkles className="w-4 h-4" />
               {t("subtitle")}
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
              {t("title")}
            </h2>
          </div>
          <div className="hidden md:block">
             <Link
                href="/catalog"
                className="group flex items-center gap-2 text-cyan-600 font-bold uppercase tracking-widest text-sm hover:text-cyan-700 transition-colors"
              >
                {tNav("catalog")}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
             </Link>
          </div>
        </div>

        {/* Cars grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayCars.map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>

        {/* Mobile View all link */}
        {cars.length > 6 && (
          <div className="text-center mt-12 md:hidden">
            <Link
              href="/catalog"
              className="inline-flex items-center px-8 py-4 bg-cyan-600 text-white font-bold rounded-2xl hover:bg-cyan-700 transition-all active:scale-95 shadow-lg shadow-cyan-200"
            >
              {tNav("catalog")}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
