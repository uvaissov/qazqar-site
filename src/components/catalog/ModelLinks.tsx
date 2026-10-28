import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";

type Model = { slug: string; name: string; brand: { name: string } };
export default async function ModelLinks({ models }: { models: Model[] }) {
  const isKz = await getLocale() === "kz";
  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      <h2 className="text-2xl font-bold text-gray-900">{isKz ? "Астанада модель бойынша автокөлік жалдау" : "Аренда автомобилей по моделям в Астане"}</h2>
      <div className="mt-5 flex flex-wrap gap-3">
        {models.map(model => <Link key={model.slug} href={`/cars/${model.slug}`} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-cyan-800 hover:bg-cyan-50">{model.brand.name} {model.name}</Link>)}
      </div>
      <div className="mt-5 flex flex-wrap gap-5 text-cyan-800 underline">
        <Link href="/rent-month">{isKz ? "Бір айға жалдау" : "Аренда на месяц"}</Link>
        <Link href="/rent-without-deposit">{isKz ? "Депозитсіз жалдау шарттары" : "Условия аренды без депозита"}</Link>
      </div>
    </section>
  );
}
