import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import ReviewsList from "@/components/admin/reviews/ReviewsList";

export default async function AdminReviewsPage() {
  const t = await getTranslations("adminContent");

  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("reviews")}</h1>
      </div>

      <ReviewsList reviews={JSON.parse(JSON.stringify(reviews))} />
    </div>
  );
}
