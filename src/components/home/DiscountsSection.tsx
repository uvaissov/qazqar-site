import { getTranslations } from "next-intl/server";
import { Percent, Sparkles } from "lucide-react";

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
    <section id="discounts" className="py-24 md:py-32 relative overflow-hidden bg-gray-950">
      {/* Decorative background elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-600/10 rounded-full blur-[120px]" />
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Section header */}
        <div className="text-center mb-16 md:mb-24">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-bold mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="uppercase tracking-widest">{t("sectionTitle")}</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight">
            {t("title")}
          </h2>
        </div>

        {/* Discounts grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {discounts.map((discount) => (
            <div
              key={discount.id}
              className="group relative"
            >
              <div className="relative glass-dark rounded-[2.5rem] p-10 h-full transition-all duration-500 hover:-translate-y-2 hover:bg-white/10 hover:shadow-2xl hover:shadow-cyan-500/10 text-center border-white/5">
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center rotate-12 group-hover:rotate-0 transition-transform duration-500 shadow-xl">
                   <Percent className="w-5 h-5 text-white" />
                </div>
                
                <div className="text-5xl md:text-6xl font-black bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent mb-4 group-hover:scale-110 transition-transform duration-500">
                  -{discount.percent}%
                </div>
                
                <div className="h-px w-12 bg-cyan-500/30 mx-auto mb-4" />
                
                <div className="text-gray-400 font-bold uppercase tracking-widest text-sm">
                  {discount.minDays}-{discount.maxDays} {t("days")}
                </div>
                
                {/* Decorative dots */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1 opacity-20">
                   {[...Array(3)].map((_, i) => (
                     <div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                   ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
