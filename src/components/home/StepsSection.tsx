import { getTranslations } from "next-intl/server";
import { MousePointer2, FileCheck, MapPin } from "lucide-react";

export default async function StepsSection() {
  const t = await getTranslations("steps");

  const steps = [
    {
      titleKey: "step1title" as const,
      descKey: "step1desc" as const,
      icon: <MousePointer2 className="w-8 h-8" />,
      color: "from-blue-500 to-cyan-500",
    },
    {
      titleKey: "step2title" as const,
      descKey: "step2desc" as const,
      icon: <FileCheck className="w-8 h-8" />,
      color: "from-purple-500 to-indigo-500",
    },
    {
      titleKey: "step3title" as const,
      descKey: "step3desc" as const,
      icon: <MapPin className="w-8 h-8" />,
      color: "from-emerald-500 to-teal-500",
    },
  ];

  return (
    <section className="py-20 md:py-32 relative overflow-hidden bg-gray-50/50">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-200/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="max-w-7xl mx-auto px-4 relative">
        {/* Section header */}
        <div className="text-center mb-16 md:mb-24">
          <span className="text-cyan-600 font-bold tracking-widest uppercase text-sm">{t("subtitle")}</span>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mt-4 tracking-tight">
            {t("title")}
          </h2>
          <div className="h-1.5 w-24 bg-cyan-500 mx-auto mt-6 rounded-full" />
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, index) => (
            <div
              key={index}
              className="group relative"
            >
              {/* Step card */}
              <div className="relative glass rounded-[2.5rem] p-10 h-full transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-200/20">
                {/* Step number indicator */}
                <div className="absolute -top-6 -right-6 w-16 h-16 rounded-3xl bg-white shadow-xl flex items-center justify-center rotate-12 group-hover:rotate-0 transition-transform duration-500">
                   <span className="text-2xl font-black text-cyan-600">{index + 1}</span>
                </div>

                {/* Icon wrapper */}
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br ${step.color} text-white mb-8 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                  {step.icon}
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-cyan-600 transition-colors">
                  {t(step.titleKey)}
                </h3>
                <p className="text-gray-500 leading-relaxed text-lg">
                  {t(step.descKey)}
                </p>
                
                {/* Progress line for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-10 w-20 h-px border-t-2 border-dashed border-gray-200" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
