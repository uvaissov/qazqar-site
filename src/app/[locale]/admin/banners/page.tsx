import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import BannerManager from "@/components/admin/banners/BannerManager";

export default async function AdminBannersPage() {
  const t = await getTranslations("adminBanners");

  const banners = await prisma.banner.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
      </div>

      <BannerManager initial={JSON.parse(JSON.stringify(banners))} />
    </div>
  );
}
