import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import CarForm from "@/components/admin/cars/CarForm";

export default async function AdminCarsNewPage() {
  const t = await getTranslations("adminCars");

  const models = await prisma.carModel.findMany({
    include: { brand: true },
    orderBy: [{ brand: { name: "asc" } }, { name: "asc" }],
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {t("creating")}
      </h1>
      <CarForm mode="create" models={JSON.parse(JSON.stringify(models))} />
    </div>
  );
}
