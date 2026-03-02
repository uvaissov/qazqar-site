import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

export default async function HeroSection() {
  const t = await getTranslations("hero");

  return (
    <section className="relative bg-gradient-to-br from-gray-900 to-cyan-900 overflow-hidden">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-400 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-cyan-300 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-32">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            {t("title")}
          </h1>
          <p className="mt-6 text-lg md:text-xl text-gray-300 leading-relaxed">
            {t("subtitle")}
          </p>
          <Link
            href="/catalog"
            className="mt-8 inline-flex items-center px-8 py-4 bg-cyan-500 text-white text-lg font-semibold rounded-xl hover:bg-cyan-600 transition-colors shadow-lg shadow-cyan-500/25"
          >
            {t("cta")}
            <svg
              className="w-5 h-5 ml-2"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
