import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import SurchargesManager from "@/components/admin/surcharges/SurchargesManager";

export default async function AdminSurchargesPage() {
  const t = await getTranslations("adminContent");

  const surcharges = await prisma.noDepositSurcharge.findMany({
    orderBy: { minDay: "asc" },
  });

  const settings = await prisma.appSetting.findMany({
    where: { key: { in: ["vatPercent", "overflowDailyPercent"] } },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("surcharges")}</h1>
        <p className="text-sm text-gray-500 mt-1">{t("surchargesDescription")}</p>
      </div>

      <SurchargesManager
        surcharges={JSON.parse(JSON.stringify(surcharges))}
        settings={JSON.parse(JSON.stringify(settings))}
      />
    </div>
  );
}
