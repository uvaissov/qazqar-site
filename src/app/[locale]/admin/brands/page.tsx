import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import BrandsList from "@/components/admin/brands/BrandsList";

export default async function AdminBrandsPage() {
  const t = await getTranslations("adminBrands");

  const brands = await prisma.carBrand.findMany({
    include: {
      models: {
        include: {
          _count: {
            select: { cars: true },
          },
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
      </div>

      <BrandsList brands={JSON.parse(JSON.stringify(brands))} />
    </div>
  );
}
