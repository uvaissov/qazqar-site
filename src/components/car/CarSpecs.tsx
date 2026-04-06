import { getTranslations } from "next-intl/server";
import type { Transmission, FuelType } from "@/generated/prisma/enums";
import { Users, Gauge, Wind, Fuel, Calendar, Droplet, CarFront, Cog } from "lucide-react";

type CarSpecsProps = {
  car: {
    year: number;
    color: string;
    transmission: Transmission;
    fuelType: FuelType;
    seats: number;
    hasAC: boolean;
    model: {
      name: string;
      brand: {
        name: string;
      };
    };
  };
};

export default async function CarSpecs({ car }: CarSpecsProps) {
  const t = await getTranslations("carDetail");

  const specs = [
    { label: t("brand"), value: car.model.brand.name, icon: <CarFront className="w-5 h-5" /> },
    { label: t("model"), value: car.model.name, icon: <Cog className="w-5 h-5" /> },
    { label: t("year"), value: car.year.toString(), icon: <Calendar className="w-5 h-5" /> },
    { label: t("color"), value: car.color, icon: <Droplet className="w-5 h-5" /> },
    {
      label: t("transmission"),
      value: car.transmission === "AUTOMATIC" ? t("automatic") : t("manual"),
      icon: <Gauge className="w-5 h-5" />
    },
    { label: t("fuel"), value: car.fuelType, icon: <Fuel className="w-5 h-5" /> },
    { label: t("seats"), value: car.seats.toString(), icon: <Users className="w-5 h-5" /> },
    { label: t("ac"), value: car.hasAC ? t("yes") : t("no"), icon: <Wind className="w-5 h-5" /> },
  ];

  return (
    <div>
      {/* Title & Price Header */}
      <div className="mb-8 p-6 glass rounded-[2rem] flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
             {car.model.brand.name} {car.model.name}
           </h1>
           <p className="text-gray-500 font-medium mt-1">{car.year} • {car.color}</p>
        </div>
        {/* TODO: цена из тарифов */}
      </div>

      {/* Specs Grid */}
      <h3 className="text-xl font-black text-gray-900 mb-4 px-2 tracking-tight">Характеристики</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {specs.map((spec) => (
          <div
            key={spec.label}
            className="flex flex-col bg-white rounded-3xl p-5 border border-gray-100 hover:shadow-xl hover:shadow-cyan-100/50 hover:border-cyan-100 hover:-translate-y-1 transition-all duration-300 group"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center mb-3 group-hover:bg-cyan-50 group-hover:text-cyan-500 transition-colors">
               {spec.icon}
            </div>
            <span className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">
              {spec.label}
            </span>
            <span className="text-base font-black text-gray-900 group-hover:text-cyan-600 transition-colors truncate">
              {spec.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
