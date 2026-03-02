import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import CarsList from "@/components/admin/cars/CarsList";

export default async function AdminCarsPage() {
  const t = await getTranslations("adminCars");

  const cars = await prisma.car.findMany({
    include: { model: { include: { brand: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <Link
          href="/admin/cars/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-500 text-white text-sm font-medium rounded-lg hover:bg-cyan-600 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          {t("add")}
        </Link>
      </div>

      <CarsList cars={JSON.parse(JSON.stringify(cars))} />
    </div>
  );
}
