"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { SlidersHorizontal, X, ChevronDown, Filter, CalendarDays } from "lucide-react";

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
  const currentTransmission = searchParams.get("transmission") || "";
  const currentPriceMin = searchParams.get("priceMin") || "";
  const currentPriceMax = searchParams.get("priceMax") || "";
  const currentDateFrom = searchParams.get("dateFrom") || "";
  const currentDateTo = searchParams.get("dateTo") || "";
  const [priceMin, setPriceMin] = useState(currentPriceMin);
  const [priceMax, setPriceMax] = useState(currentPriceMax);

  const today = new Date().toISOString().split("T")[0];

  function applyPreset(days: number) {
    const from = new Date();
    from.setDate(from.getDate() + 1);
    const to = new Date(from);
    to.setDate(to.getDate() + days);
    updateParams({
      dateFrom: from.toISOString().split("T")[0],
      dateTo: to.toISOString().split("T")[0],
    });
  }

  function isPresetActive(days: number) {
    if (!currentDateFrom || !currentDateTo) return false;
    const from = new Date();
    from.setDate(from.getDate() + 1);
    const to = new Date(from);
    to.setDate(to.getDate() + days);
    return currentDateFrom === from.toISOString().split("T")[0] && currentDateTo === to.toISOString().split("T")[0];
  }

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
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function resetFilters() {
    setPriceMin("");
    setPriceMax("");
    router.push(pathname, { scroll: false });
  }

  const hasActiveFilters =
    currentBrand || currentTransmission || currentPriceMin || currentPriceMax || currentDateFrom || currentDateTo;

  return (
    <div className="glass rounded-[2rem] p-6 md:p-8 transition-all duration-500 shadow-xl shadow-cyan-100/20">
      <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-4">
         <SlidersHorizontal className="w-5 h-5 text-cyan-600" />
         <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">{t("found").split(":")[0]}</h2>
      </div>
      
      {/* Date range + presets */}
      <div className="mb-6 space-y-2">
        <div className="flex items-center gap-2 ml-1">
          <CalendarDays className="w-4 h-4 text-cyan-600" />
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">
            {t("dateLabel")}
          </label>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <input
              type="date"
              min={today}
              value={currentDateFrom}
              onChange={(e) => updateParams({ dateFrom: e.target.value })}
              className="min-w-0 flex-1 appearance-none bg-white rounded-2xl border-2 border-gray-100 px-4 py-3 text-sm font-bold text-gray-900 focus:border-cyan-500 focus:outline-none transition-all hover:border-gray-200 sm:flex-none"
            />
            <span className="text-gray-400 text-sm font-bold">—</span>
            <input
              type="date"
              min={currentDateFrom || today}
              value={currentDateTo}
              onChange={(e) => updateParams({ dateTo: e.target.value })}
              className="min-w-0 flex-1 appearance-none bg-white rounded-2xl border-2 border-gray-100 px-4 py-3 text-sm font-bold text-gray-900 focus:border-cyan-500 focus:outline-none transition-all hover:border-gray-200 sm:flex-none"
            />
          </div>
          <div className="flex gap-2">
            {([
              { days: 1, label: t("preset1Day") },
              { days: 3, label: t("preset3Days") },
              { days: 7, label: t("preset1Week") },
              { days: 30, label: t("preset1Month") },
            ] as const).map(({ days, label }) => (
              <button
                key={days}
                type="button"
                onClick={() => applyPreset(days)}
                className={`px-4 py-3 text-xs font-black uppercase tracking-tighter rounded-xl transition-all ${
                  isPresetActive(days)
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "bg-gray-50 text-gray-400 border-2 border-gray-100 hover:text-gray-600 hover:border-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
        {/* Brand select */}
        <div className="space-y-2">
          <label
            htmlFor="brand-filter"
            className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1"
          >
            {t("brandLabel")}
          </label>
          <div className="relative group">
            <select
              id="brand-filter"
              value={currentBrand}
              onChange={(e) => updateParams({ brand: e.target.value })}
              className="w-full appearance-none bg-white rounded-2xl border-2 border-gray-100 px-4 py-4 text-sm font-bold text-gray-900 focus:border-cyan-500 focus:outline-none transition-all group-hover:border-gray-200 cursor-pointer"
            >
              <option value="">{t("allBrands")}</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.slug}>
                  {brand.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-cyan-600 transition-colors" />
          </div>
        </div>

        {/* Transmission toggle */}
        <div className="space-y-2">
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
            {t("transmissionLabel")}
          </label>
          <div className="flex p-1 bg-gray-50 rounded-2xl border-2 border-gray-100 group-hover:border-gray-200 transition-all">
            <button
              type="button"
              onClick={() => updateParams({ transmission: "" })}
              className={`flex-1 px-4 py-3 text-xs font-black uppercase tracking-tighter rounded-xl transition-all ${
                !currentTransmission
                  ? "bg-white text-cyan-600 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {t("transmissionAll")}
            </button>
            <button
              type="button"
              onClick={() => updateParams({ transmission: "AUTOMATIC" })}
              className={`flex-1 px-4 py-3 text-xs font-black uppercase tracking-tighter rounded-xl transition-all ${
                currentTransmission === "AUTOMATIC"
                  ? "bg-white text-cyan-600 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {t("transmissionAutomatic").substring(0, 4)}
            </button>
            <button
              type="button"
              onClick={() => updateParams({ transmission: "MANUAL" })}
              className={`flex-1 px-4 py-3 text-xs font-black uppercase tracking-tighter rounded-xl transition-all ${
                currentTransmission === "MANUAL"
                  ? "bg-white text-cyan-600 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {t("transmissionManual").substring(0, 4)}
            </button>
          </div>
        </div>

        {/* Price range */}
        <div className="space-y-2">
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
            {t("priceFrom")} — {t("priceTo")}
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="numeric"
              placeholder={t("priceFrom")}
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              onBlur={() => { if (priceMin !== currentPriceMin) updateParams({ priceMin }); }}
              onKeyDown={(e) => { if (e.key === "Enter") updateParams({ priceMin }); }}
              className="w-full appearance-none bg-white rounded-2xl border-2 border-gray-100 px-4 py-4 text-sm font-bold text-gray-900 placeholder:text-gray-300 placeholder:font-medium focus:border-cyan-500 focus:outline-none transition-all hover:border-gray-200 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <input
              type="number"
              inputMode="numeric"
              placeholder={t("priceTo")}
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              onBlur={() => { if (priceMax !== currentPriceMax) updateParams({ priceMax }); }}
              onKeyDown={(e) => { if (e.key === "Enter") updateParams({ priceMax }); }}
              className="w-full appearance-none bg-white rounded-2xl border-2 border-gray-100 px-4 py-4 text-sm font-bold text-gray-900 placeholder:text-gray-300 placeholder:font-medium focus:border-cyan-500 focus:outline-none transition-all hover:border-gray-200 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
        </div>

        {/* Reset button */}
        <div className="flex-shrink-0">
           {hasActiveFilters ? (
            <button
              type="button"
              onClick={resetFilters}
              className="w-full px-6 py-4 flex items-center justify-center gap-2 bg-rose-50 text-rose-600 font-bold rounded-2xl hover:bg-rose-100 transition-all group/reset"
            >
              <X className="w-5 h-5 group-reset-hover:rotate-90 transition-transform duration-300" />
              {t("reset")}
            </button>
           ) : (
            <div className="w-full px-6 py-4 flex items-center justify-center gap-2 bg-cyan-600 text-white font-bold rounded-2xl opacity-50 cursor-default">
              <Filter className="w-5 h-5" />
              Фильтр
            </div>
           )}
        </div>
      </div>
    </div>
  );
}
