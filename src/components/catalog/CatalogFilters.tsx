"use client";

import { useSearchParams } from "next/navigation";
import { useRouter, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";

type Brand = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
};

export default function CatalogFilters({ brands }: { brands: Brand[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("catalogPage");

  const currentBrand = searchParams.get("brand") || "";
  const currentMinPrice = searchParams.get("minPrice") || "";
  const currentMaxPrice = searchParams.get("maxPrice") || "";
  const currentTransmission = searchParams.get("transmission") || "";

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function resetFilters() {
    router.push(pathname);
  }

  const hasActiveFilters =
    currentBrand || currentMinPrice || currentMaxPrice || currentTransmission;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
      <div className="flex flex-col lg:flex-row lg:items-end gap-4">
        {/* Brand select */}
        <div className="flex-1 min-w-0">
          <label
            htmlFor="brand-filter"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t("brandLabel")}
          </label>
          <select
            id="brand-filter"
            value={currentBrand}
            onChange={(e) => updateParams({ brand: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
          >
            <option value="">{t("allBrands")}</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.slug}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>

        {/* Min price */}
        <div className="flex-1 min-w-0">
          <label
            htmlFor="min-price"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t("priceFrom")}
          </label>
          <input
            id="min-price"
            type="number"
            value={currentMinPrice}
            placeholder={t("pricePlaceholderMin")}
            onChange={(e) => updateParams({ minPrice: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
          />
        </div>

        {/* Max price */}
        <div className="flex-1 min-w-0">
          <label
            htmlFor="max-price"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t("priceTo")}
          </label>
          <input
            id="max-price"
            type="number"
            value={currentMaxPrice}
            placeholder={t("pricePlaceholderMax")}
            onChange={(e) => updateParams({ maxPrice: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
          />
        </div>

        {/* Transmission toggle */}
        <div className="flex-1 min-w-0">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("transmissionLabel")}
          </label>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              type="button"
              onClick={() => updateParams({ transmission: "" })}
              className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors ${
                !currentTransmission
                  ? "bg-cyan-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {t("transmissionAll")}
            </button>
            <button
              type="button"
              onClick={() => updateParams({ transmission: "AUTOMATIC" })}
              className={`flex-1 px-3 py-2.5 text-sm font-medium border-x border-gray-300 transition-colors ${
                currentTransmission === "AUTOMATIC"
                  ? "bg-cyan-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {t("transmissionAutomatic")}
            </button>
            <button
              type="button"
              onClick={() => updateParams({ transmission: "MANUAL" })}
              className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors ${
                currentTransmission === "MANUAL"
                  ? "bg-cyan-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {t("transmissionManual")}
            </button>
          </div>
        </div>

        {/* Reset button */}
        {hasActiveFilters && (
          <div className="flex-shrink-0">
            <button
              type="button"
              onClick={resetFilters}
              className="w-full lg:w-auto px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t("reset")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
