export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import CarsList from "@/components/admin/cars/CarsList";
import SyncStatus from "@/components/admin/cars/SyncStatus";

export default async function AdminCarsPage() {
  const t = await getTranslations("adminCars");

  const cars = await prisma.car.findMany({
    include: { model: { include: { brand: true } }, photos: { include: { photo: true }, orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
      </div>

      <SyncStatus />
      <CarsList cars={JSON.parse(JSON.stringify(cars))} />
    </div>
  );
}
