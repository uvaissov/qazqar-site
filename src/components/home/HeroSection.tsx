import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { BentoGrid, BentoCard } from "@/components/ui/BentoGrid";
import { Car, ShieldCheck, Zap, Clock } from "lucide-react";

export default async function HeroSection() {
  const t = await getTranslations("hero");
  const tAbout = await getTranslations("aboutPage");

  return (
    <section className="py-12 md:py-20 bg-gray-50/50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <BentoGrid className="md:auto-rows-[240px]">
          {/* Main Content Card */}
          <BentoCard colSpan={3} rowSpan={2} className="bg-gradient-to-br from-cyan-600 to-cyan-800 text-white border-none">
            <div className="h-full flex flex-col justify-center max-w-2xl">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                {t("title")}
              </h1>
              <p className="mt-6 text-lg md:text-xl text-cyan-50/80 leading-relaxed">
                {t("subtitle")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row flex-wrap gap-4">
                <Link
                  href="/catalog"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-cyan-700 text-lg font-semibold rounded-2xl hover:bg-cyan-50 transition-all shadow-xl shadow-black/10 active:scale-95"
                >
                  {t("cta")}
                  <Zap className="w-5 h-5 ml-2 fill-current" />
                </Link>
                <a
                  href="#about"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-md text-white text-lg font-semibold rounded-2xl hover:bg-white/20 transition-all border border-white/20"
                >
                  {tAbout("whyUs")}
                </a>
              </div>
            </div>
            
            {/* Decorative element */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 opacity-10 group-hover:opacity-20 transition-opacity">
               <Car size={300} strokeWidth={0.5} />
            </div>
          </BentoCard>

          {/* Stat 1: Cars Count */}
          <BentoCard colSpan={1} rowSpan={1} className="bg-white flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-cyan-100 text-cyan-600 rounded-2xl flex items-center justify-center mb-4">
              <Car className="w-6 h-6" />
            </div>
            <span className="text-3xl font-bold text-gray-900">20+</span>
            <span className="text-gray-500 mt-1">{tAbout("reason1").split(" — ")[1] || "Автомобилей"}</span>
          </BentoCard>

          {/* Stat 2: Price */}
          <BentoCard colSpan={1} rowSpan={1} className="bg-cyan-50 flex flex-col items-center justify-center text-center border-cyan-100">
            <div className="w-12 h-12 bg-white text-cyan-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-cyan-700">14 000 ₸</span>
            <span className="text-cyan-600/70 mt-1">от / сутки</span>
          </BentoCard>
          
          {/* Extra: Support (Hidden on small screens if needed, but let's keep it) */}
          <div className="md:hidden lg:flex lg:col-span-1 lg:row-span-1 contents">
             <BentoCard colSpan={1} rowSpan={1} className="bg-white/80 group">
                <div className="flex flex-col h-full justify-between">
                  <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">24/7</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{tAbout("reason4")}</p>
                  </div>
                </div>
             </BentoCard>
          </div>
          
          <BentoCard colSpan={1} rowSpan={1} className="bg-gradient-to-br from-rose-500 to-rose-600 text-white border-none">
             <div className="flex flex-col h-full justify-between">
                <div className="text-rose-100/50">
                  <Zap className="w-8 h-8" />
                </div>
                <div>
                   <h3 className="text-xl font-bold">15 мин</h3>
                   <p className="text-rose-100/80 text-sm">Оформление</p>
                </div>
             </div>
          </BentoCard>

          <BentoCard colSpan={2} rowSpan={1} className="bg-white group overflow-hidden">
             <div className="flex items-center gap-6 h-full">
                <div className="flex-1">
                   <h3 className="text-xl font-bold text-gray-900">Без депозита</h3>
                   <p className="text-gray-500 mt-1 text-sm">Для постоянных клиентов особые условия и отсутствие залога.</p>
                </div>
                <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                   <ShieldCheck size={48} className="text-gray-300" />
                </div>
             </div>
          </BentoCard>

        </BentoGrid>
      </div>
    </section>
  );
}
