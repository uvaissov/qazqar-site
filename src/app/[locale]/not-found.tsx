import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("errors");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-8xl font-bold text-gray-200">404</h1>
      <h2 className="mt-4 text-2xl font-semibold text-gray-900">{t("notFoundTitle")}</h2>
      <p className="mt-2 text-gray-500">{t("notFoundDescription")}</p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-cyan-500 px-6 py-2.5 font-medium text-white hover:bg-cyan-600 transition-colors"
      >
        {t("backHome")}
      </Link>
    </div>
  );
}
