import { getTranslations } from "next-intl/server";
import type { Transmission, FuelType } from "@/generated/prisma/enums";

type CarSpecsProps = {
  car: {
    year: number;
    color: string;
    pricePerDay: number;
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
    { label: t("brand"), value: car.model.brand.name },
    { label: t("model"), value: car.model.name },
    { label: t("year"), value: car.year.toString() },
    { label: t("color"), value: car.color },
    {
      label: t("transmission"),
      value: car.transmission === "AUTOMATIC" ? t("automatic") : t("manual"),
    },
    { label: t("fuel"), value: car.fuelType },
    { label: t("seats"), value: car.seats.toString() },
    { label: t("ac"), value: car.hasAC ? t("yes") : t("no") },
  ];

  return (
    <div>
      {/* Price */}
      <div className="mb-6">
        <p className="text-3xl font-bold text-gray-900">
          {t("priceFrom")} {car.pricePerDay.toLocaleString()} {t("perDay")}
        </p>
        <p className="mt-1 text-sm text-cyan-600 font-medium">
          {t("discountInfo")}
        </p>
      </div>

      {/* Specs grid */}
      <div className="grid grid-cols-2 gap-4">
        {specs.map((spec) => (
          <div
            key={spec.label}
            className="flex flex-col border border-gray-100 rounded-lg p-3"
          >
            <span className="text-xs text-gray-500 uppercase tracking-wide">
              {spec.label}
            </span>
            <span className="mt-1 text-sm font-semibold text-gray-900">
              {spec.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
