import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import FaqManager from "@/components/admin/faq/FaqManager";

export default async function AdminFaqPage() {
  const t = await getTranslations("adminContent");

  const items = await prisma.faqItem.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("faq")}</h1>
      </div>

      <FaqManager items={JSON.parse(JSON.stringify(items))} />
    </div>
  );
}
