import { getTranslations } from "next-intl/server";
import { BentoGrid, BentoCard } from "@/components/ui/BentoGrid";
import { Info, History, MapPin, Phone } from "lucide-react";

export default async function AboutSection() {
  const t = await getTranslations("about");
  const tAboutPage = await getTranslations("aboutPage");
  const tCommon = await getTranslations("common");

  return (
    <section id="about" className="py-20 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <span className="text-cyan-500 font-bold uppercase tracking-widest text-sm">
              {t("sectionTitle")}
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mt-2">
              {t("title")}
            </h2>
          </div>
          <div className="h-px flex-1 bg-gray-100 mb-4 hidden md:block" />
        </div>

        <BentoGrid className="md:auto-rows-[200px]">
          {/* Main Description */}
          <BentoCard colSpan={2} rowSpan={2} className="bg-gray-50 flex flex-col justify-center gap-6">
             <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-cyan-600">
                <Info className="w-6 h-6" />
             </div>
             <div>
                <p className="text-xl text-gray-700 leading-relaxed font-medium">
                  {t("description")}
                </p>
                <p className="mt-4 text-gray-500">
                  {tAboutPage("story")}
                </p>
             </div>
          </BentoCard>

          {/* Experience Stat */}
          <BentoCard colSpan={1} rowSpan={1} className="bg-cyan-600 text-white border-none flex flex-col justify-between">
             <History className="w-8 h-8 opacity-50" />
             <div>
                <span className="text-4xl font-black">3+</span>
                <p className="text-cyan-100 font-medium">Года опыта</p>
             </div>
          </BentoCard>

          {/* Location Card */}
          <BentoCard colSpan={1} rowSpan={1} className="bg-white flex flex-col justify-between group">
             <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 group-hover:text-cyan-600 transition-colors">
                <MapPin className="w-5 h-5" />
             </div>
             <div>
                <h3 className="font-bold text-gray-900">Астана</h3>
                <p className="text-sm text-gray-500">{tAboutPage("address")}</p>
             </div>
          </BentoCard>

          {/* Contact Card */}
          <BentoCard colSpan={2} rowSpan={1} className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white border-none overflow-hidden group">
             <div className="flex items-center gap-6 h-full relative z-10">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                   <Phone className="w-8 h-8" />
                </div>
                <div>
                   <span className="text-indigo-100/70 text-sm font-medium uppercase tracking-wider">{tAboutPage("contacts")}</span>
                   <h3 className="text-2xl font-black tracking-tight mt-1">{tCommon("phone")}</h3>
                </div>
             </div>
             {/* Decorative element */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          </BentoCard>
        </BentoGrid>
      </div>
    </section>
  );
}
