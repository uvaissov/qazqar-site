import { getTranslations } from "next-intl/server";

export default async function AboutSection() {
  const t = await getTranslations("about");

  return (
    <section id="about" className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Placeholder image */}
          <div className="relative aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-300">
                <svg
                  className="w-24 h-24 mx-auto"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={0.75}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
                  />
                </svg>
              </div>
            </div>
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-transparent" />
          </div>

          {/* Text content */}
          <div>
            <span className="text-cyan-500 font-semibold text-sm uppercase tracking-wider">
              {t("sectionTitle")}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">
              {t("title")}
            </h2>
            <p className="text-gray-600 mt-6 text-lg leading-relaxed">
              {t("description")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
