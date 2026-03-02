import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import DiscountsManager from "@/components/admin/discounts/DiscountsManager";

export default async function AdminDiscountsPage() {
  const t = await getTranslations("adminContent");

  const discounts = await prisma.discount.findMany({
    orderBy: { minDays: "asc" },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("discounts")}</h1>
      </div>

      <DiscountsManager
        discounts={JSON.parse(JSON.stringify(discounts))}
      />
    </div>
  );
}
