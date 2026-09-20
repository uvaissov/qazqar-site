import { getTranslations } from "next-intl/server";
import type { Season } from "@/lib/pricing";

type Props = {
  tariff: {
    maxDays: number;
    tiers: { minDays: number; maxDays: number; pricePerDay: number }[];
  } | null;
  season: Season;
};

/**
 * Тарифная сетка машины на странице каталога: цена за сутки по сроку в
 * текущем сезоне. Заменила блок «Скидка до 40%».
 */
export default async function TariffTable({ tariff, season }: Props) {
  const t = await getTranslations("carDetail");

  if (!tariff) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        {t("noTariff")}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="font-bold text-gray-900">{t("tariffTitle")}</h3>
        <span className="text-xs text-gray-400">
          {season === "summer" ? t("tariffSeasonSummer") : t("tariffSeasonWinter")}
        </span>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {tariff.tiers.map((tier) => (
            <tr key={tier.minDays} className="border-t border-gray-100">
              <td className="py-2 text-gray-600">
                {tier.minDays === tier.maxDays ? tier.minDays : `${tier.minDays}–${tier.maxDays}`} {t("tariffDays")}
              </td>
              <td className="py-2 text-right font-semibold text-gray-900">
                {tier.pricePerDay.toLocaleString()} <span className="text-xs font-normal text-gray-400">{t("perDay")}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-gray-400">{t("tariffMaxDays", { days: tariff.maxDays })}</p>
    </div>
  );
}
