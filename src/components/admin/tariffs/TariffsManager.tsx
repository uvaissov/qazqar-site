"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Tier = { minDays: number; maxDays: number; priceSummer: number; priceWinter: number };

export type TariffRow = {
  id: string;
  name: string;
  deposit: number;
  active: boolean;
  tiers: Tier[];
  cars: { id: string; number: string; year: number; model: { name: string; brand: { name: string } } }[];
};

type Props = {
  tariffs: TariffRow[];
  season: { summerFrom: number; summerTo: number };
};

type TierForm = { minDays: string; maxDays: string; priceSummer: string; priceWinter: string };
type TariffForm = { name: string; deposit: string; active: boolean; tiers: TierForm[] };

const MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

/** Пустая форма — сетка прайс-листа: 1–2, 3–5, 6–15, 16–30. */
const emptyForm = (): TariffForm => ({
  name: "",
  deposit: "50000",
  active: true,
  tiers: [
    { minDays: "1", maxDays: "2", priceSummer: "", priceWinter: "" },
    { minDays: "3", maxDays: "5", priceSummer: "", priceWinter: "" },
    { minDays: "6", maxDays: "15", priceSummer: "", priceWinter: "" },
    { minDays: "16", maxDays: "30", priceSummer: "", priceWinter: "" },
  ],
});

const toForm = (t: TariffRow): TariffForm => ({
  name: t.name,
  deposit: String(t.deposit),
  active: t.active,
  tiers: t.tiers.map((x) => ({
    minDays: String(x.minDays),
    maxDays: String(x.maxDays),
    priceSummer: String(x.priceSummer),
    priceWinter: String(x.priceWinter),
  })),
});

const input =
  "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none";

/**
 * Тарифные сетки: список, форма тарифа со ступенями, настройки сезона.
 * Ступени сохраняются вместе с тарифом одним запросом — сервер проверяет,
 * что они идут подряд с первого дня.
 */
export default function TariffsManager({ tariffs, season }: Props) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<TariffForm>(emptyForm());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  // Неактивные тарифы (снятые с прайса модели) по умолчанию не показываем
  const [showInactive, setShowInactive] = useState(false);
  const inactiveCount = tariffs.filter((t) => !t.active).length;
  const visibleTariffs = showInactive ? tariffs : tariffs.filter((t) => t.active);

  const [summerFrom, setSummerFrom] = useState(String(season.summerFrom));
  const [summerTo, setSummerTo] = useState(String(season.summerTo));
  const [savingSeason, setSavingSeason] = useState(false);

  const startAdd = () => {
    setEditingId(null);
    setShowAdd(true);
    setForm(emptyForm());
    setError("");
  };
  const startEdit = (t: TariffRow) => {
    setShowAdd(false);
    setEditingId(t.id);
    setForm(toForm(t));
    setError("");
  };
  const cancel = () => {
    setEditingId(null);
    setShowAdd(false);
    setError("");
  };

  const setTier = (i: number, patch: Partial<TierForm>) =>
    setForm((f) => ({ ...f, tiers: f.tiers.map((t, j) => (j === i ? { ...t, ...patch } : t)) }));
  const addTier = () =>
    setForm((f) => {
      const last = f.tiers[f.tiers.length - 1];
      const next = last ? String((Number(last.maxDays) || 0) + 1) : "1";
      return { ...f, tiers: [...f.tiers, { minDays: next, maxDays: "", priceSummer: "", priceWinter: "" }] };
    });
  const removeTier = (i: number) => setForm((f) => ({ ...f, tiers: f.tiers.filter((_, j) => j !== i) }));

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(editingId ? `/api/admin/tariffs/${editingId}` : "/api/admin/tariffs", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          deposit: Number(form.deposit),
          active: form.active,
          tiers: form.tiers.map((t) => ({
            minDays: Number(t.minDays),
            maxDays: Number(t.maxDays),
            priceSummer: Number(t.priceSummer),
            priceWinter: Number(t.priceWinter),
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Не удалось сохранить");
        return;
      }
      cancel();
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (t: TariffRow) => {
    if (!confirm(`Удалить тариф «${t.name}»?`)) return;
    const res = await fetch(`/api/admin/tariffs/${t.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error || "Не удалось удалить");
      return;
    }
    router.refresh();
  };

  const saveSeason = async () => {
    setSavingSeason(true);
    try {
      await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: [
            { key: "seasonSummerFrom", value: summerFrom },
            { key: "seasonSummerTo", value: summerTo },
          ],
        }),
      });
      router.refresh();
    } finally {
      setSavingSeason(false);
    }
  };

  const formView = (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
          <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Hyundai Elantra 2024" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Депозит (₸)</label>
          <input className={input} type="number" min={0} step={1000} value={form.deposit} onChange={(e) => setForm({ ...form, deposit: e.target.value })} />
        </div>
      </div>

      <div>
        <div className="grid grid-cols-[1fr_1fr_1.4fr_1.4fr_auto] gap-2 text-xs font-medium text-gray-500 mb-1 px-1">
          <span>Дней от</span><span>до</span><span>Лето, ₸/сутки</span><span>Зима, ₸/сутки</span><span />
        </div>
        <div className="space-y-2">
          {form.tiers.map((t, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1.4fr_1.4fr_auto] gap-2 items-center">
              <input className={input} type="number" min={1} value={t.minDays} onChange={(e) => setTier(i, { minDays: e.target.value })} />
              <input className={input} type="number" min={1} value={t.maxDays} onChange={(e) => setTier(i, { maxDays: e.target.value })} />
              <input className={input} type="number" min={0} step={500} value={t.priceSummer} onChange={(e) => setTier(i, { priceSummer: e.target.value })} />
              <input className={input} type="number" min={0} step={500} value={t.priceWinter} onChange={(e) => setTier(i, { priceWinter: e.target.value })} />
              <button type="button" onClick={() => removeTier(i)} className="text-gray-400 hover:text-red-500 px-2" title="Убрать ступень">✕</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addTier} className="mt-2 text-sm text-cyan-600 hover:text-cyan-700">+ Ступень</button>
        <p className="mt-2 text-xs text-gray-500">Ступени идут подряд с 1 дня; последняя ступень задаёт максимальный срок аренды.</p>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
        Тариф действует (по неактивному тарифу машины не бронируются)
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button onClick={save} disabled={saving} className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 disabled:opacity-50">
          {saving ? "Сохранение…" : "Сохранить"}
        </button>
        <button onClick={cancel} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Отмена</button>
      </div>
    </div>
  );

  return (
    <div>
      {/* Сезон */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-1">Летний сезон</h2>
        <p className="text-sm text-gray-500 mb-3">Летняя цена действует, если аренда начинается в этих месяцах (включительно); в остальные — зимняя.</p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">С месяца</label>
            <select className={input} value={summerFrom} onChange={(e) => setSummerFrom(e.target.value)}>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">По месяц</label>
            <select className={input} value={summerTo} onChange={(e) => setSummerTo(e.target.value)}>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <button onClick={saveSeason} disabled={savingSeason} className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
            {savingSeason ? "Сохранение…" : "Сохранить сезон"}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">Тарифы ({visibleTariffs.length})</h2>
        <div className="flex items-center gap-4">
          {inactiveCount > 0 && (
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
              Показать неактивные ({inactiveCount})
            </label>
          )}
          {!showAdd && (
            <button onClick={startAdd} className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700">+ Тариф</button>
          )}
        </div>
      </div>

      {showAdd && formView}

      <div className="space-y-3">
        {visibleTariffs.map((t) => (
          <div key={t.id} className={`bg-white rounded-xl border ${t.active ? "border-gray-200" : "border-dashed border-gray-300 opacity-70"}`}>
            {editingId === t.id ? (
              <div className="p-1">{formView}</div>
            ) : (
              <div className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-gray-900">
                      {t.name}
                      {!t.active && <span className="ml-2 text-xs font-normal text-gray-500">неактивен</span>}
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      Депозит {t.deposit.toLocaleString()} ₸ · до {Math.max(0, ...t.tiers.map((x) => x.maxDays))} дней ·{" "}
                      <button className="text-cyan-600 hover:underline" onClick={() => setExpanded(expanded === t.id ? null : t.id)}>
                        машин: {t.cars.length}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-3 text-sm">
                    <button onClick={() => startEdit(t)} className="text-cyan-600 hover:text-cyan-700">Редактировать</button>
                    <button onClick={() => remove(t)} className="text-red-500 hover:text-red-600">Удалить</button>
                  </div>
                </div>

                <table className="mt-3 text-sm w-full max-w-lg">
                  <thead>
                    <tr className="text-xs text-gray-500">
                      <th className="text-left font-medium py-1">Срок</th>
                      <th className="text-right font-medium py-1">Лето</th>
                      <th className="text-right font-medium py-1">Зима</th>
                    </tr>
                  </thead>
                  <tbody>
                    {t.tiers.map((x) => (
                      <tr key={x.minDays} className="border-t border-gray-100">
                        <td className="py-1 text-gray-700">{x.minDays === x.maxDays ? `${x.minDays}` : `${x.minDays}–${x.maxDays}`} дн.</td>
                        <td className="py-1 text-right text-gray-900">{x.priceSummer.toLocaleString()} ₸</td>
                        <td className="py-1 text-right text-gray-900">{x.priceWinter.toLocaleString()} ₸</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {expanded === t.id && (
                  <div className="mt-3 text-sm text-gray-600">
                    {t.cars.length === 0 ? (
                      <span>Машин нет — привяжите тариф в карточке авто.</span>
                    ) : (
                      <ul className="flex flex-wrap gap-2">
                        {t.cars.map((c) => (
                          <li key={c.id} className="px-2 py-0.5 bg-gray-100 rounded">
                            {c.model.brand.name} {c.model.name} {c.year} · {c.number}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {tariffs.length === 0 && <p className="text-sm text-gray-500">Тарифов пока нет.</p>}
      </div>
    </div>
  );
}
