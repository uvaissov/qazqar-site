import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import CarForm from "@/components/admin/cars/CarForm";

interface EditCarPageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function AdminCarsEditPage({ params }: EditCarPageProps) {
  const { id } = await params;
  const t = await getTranslations("adminCars");

  const car = await prisma.car.findUnique({
    where: { id },
    include: { model: { include: { brand: true } }, photos: { include: { photo: true }, orderBy: { sortOrder: "asc" } } },
  });

  if (!car) {
    notFound();
  }

  const models = await prisma.carModel.findMany({
    include: { brand: true },
    orderBy: [{ brand: { name: "asc" } }, { name: "asc" }],
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {t("editing")}
      </h1>
      <CarForm
        mode="edit"
        car={JSON.parse(JSON.stringify(car))}
        models={JSON.parse(JSON.stringify(models))}
      />
    </div>
  );
}
