import { getTranslations } from "next-intl/server";

type Discount = {
  id: string;
  minDays: number;
  maxDays: number;
  percent: number;
};

export default async function DiscountsSection({
  discounts,
}: {
  discounts: Discount[];
}) {
  const t = await getTranslations("discounts");

  return (
    <section id="discounts" className="py-16 md:py-24 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-12">
          <span className="text-cyan-400 font-semibold text-sm uppercase tracking-wider">
            {t("sectionTitle")}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mt-2">
            {t("title")}
          </h2>
        </div>

        {/* Discounts grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {discounts.map((discount) => (
            <div
              key={discount.id}
              className="relative bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/20 rounded-xl p-6 text-center hover:border-cyan-500/40 transition-colors"
            >
              <div className="text-4xl md:text-5xl font-bold text-cyan-400">
                -{discount.percent}%
              </div>
              <div className="text-gray-300 mt-2 text-sm">
                {discount.minDays}-{discount.maxDays} {t("days")}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
