import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicModel } from "@/lib/data/models";
import { pageAlternates, breadcrumbData, SITE_URL } from "@/lib/seo";
import { getSeasonBounds, seasonFor, tierPrice, sortedTiers, tariffMaxDays } from "@/lib/pricing";
import { Link } from "@/i18n/routing";
import CatalogGrid from "@/components/catalog/CatalogGrid";
import JsonLd from "@/components/seo/JsonLd";
import TariffTable from "@/components/car/TariffTable";

type Params = Promise<{ locale: string; slug: string }>;
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  const model = await getPublicModel(slug);
  if (!model) notFound();
  const label = `${model.brand.name} ${model.name}`;
  const kz = locale === "kz";
  return {
    title: kz ? `${label} — Астанада жүргізушісіз жалдау | Qazqar` : `Аренда ${label} в Астане без водителя | Qazqar`,
    description: kz ? `${label} жалдау: автокөліктер, мерзім бойынша тарифтер, депозит шарттары. Каталогтан қолжетімді автокөлікті таңдаңыз.` : `Прокат ${label} в Астане: автомобили, тарифы по срокам и условия депозита. Выберите доступный автомобиль в каталоге для бронирования.`,
    alternates: pageAlternates(locale, `/cars/${slug}`),
    openGraph: { url: `/${locale}/cars/${slug}`, type: "website", ...(model.cars[0]?.photos[0] && { images: [{ url: model.cars[0].photos[0].photo.url }] }) },
  };
}

export default async function ModelPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  const model = await getPublicModel(slug);
  if (!model) notFound();
  const kz = locale === "kz";
  const label = `${model.brand.name} ${model.name}`;
  const season = seasonFor(new Date(), await getSeasonBounds());
  const tariffs = [...new Map(model.cars.filter(car => car.tariff?.active && car.tariff.tiers.length).map(car => [car.tariff!.id, car.tariff!])).values()];
  const years = [...new Set(model.cars.map(car => car.year))].sort().join(", ");
  const available = model.cars.filter(car => car.status === "AVAILABLE").length;
  const crumbs = [{ name: kz ? "Басты бет" : "Главная", path: `/${locale}` }, { name: kz ? "Каталог" : "Каталог", path: `/${locale}/catalog` }, { name: label, path: `/${locale}/cars/${slug}` }];
  return (
    <main className="min-h-screen bg-gray-50 pb-16">
      <JsonLd data={breadcrumbData(crumbs)} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ItemList", itemListElement: model.cars.map((car, index) => ({ "@type": "ListItem", position: index + 1, url: `${SITE_URL}/${locale}/catalog/${car.slug}`, name: `${label} ${car.year}` })) }} />
      <div className="max-w-7xl mx-auto px-4 py-10">
        <nav aria-label={kz ? "Навигация" : "Хлебные крошки"} className="mb-5 text-sm text-cyan-800"><Link href="/catalog">{kz ? "Автокөлік каталогы" : "Каталог автомобилей"}</Link> / {label}</nav>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{kz ? `Астанада ${label} жалдау` : `Аренда ${label} в Астане без водителя`}</h1>
        <div className="mt-7">
          <div className="max-w-4xl space-y-5 text-gray-700">
            <p>{kz ? `${label} автокөлігін сапар мерзіміне қарай таңдаңыз. Тариф кестесінде күндік баға жалдау ұзақтығына байланысты көрсетілген; нақты күндерге есеп брондау кезінде жасалады.` : `Выберите ${label} для поездки по Астане. В тарифах ниже указана стоимость суток в зависимости от длительности аренды; точный расчёт на ваши даты доступен в форме бронирования.`}</p>
            {years && <p>{kz ? "Автопарктегі шығарылған жылдар" : "Годы выпуска в автопарке"}: {years}. {kz ? "Қазір бос" : "Сейчас свободно"}: {available}.</p>}
            <h2 className="text-2xl font-bold text-gray-900">{kz ? "Тарифтер және депозит" : "Тарифы и депозит"}</h2>
            <p>{kz ? "Баға маусымға және мерзімге байланысты. Депозит пен депозитсіз жалдау үстемесі таңдалған автокөлікке есептеледі. Брондау алдында толық есепті тексеріңіз." : "Стоимость зависит от сезона и срока. Депозит и надбавка за аренду без депозита рассчитываются для выбранного автомобиля. Перед отправкой заявки проверьте полный расчёт."}</p>
            {tariffs.map(tariff => <TariffTable key={tariff.id} season={season} tariff={{ maxDays: tariffMaxDays(tariff), tiers: sortedTiers(tariff).map(tier => ({ minDays: tier.minDays, maxDays: tier.maxDays, pricePerDay: tierPrice(tier, season) })) }} />)}
            <h2 className="text-2xl font-bold text-gray-900">{kz ? "Автокөлікті қалай алу керек" : "Как получить автомобиль"}</h2>
            <p>{kz ? "Автокөлікті таңдаңыз, күндерді көрсетіп, өтінім жіберіңіз. Құжаттар мен жалдау шарттары брондау кезінде нақтыланады. Қала бойынша жеткізу менеджермен келісіледі." : "Выберите машину, укажите даты и отправьте заявку. Документы и условия аренды уточняются при оформлении. Доставка по городу согласуется с менеджером."}</p>
            <div className="flex flex-wrap gap-4 text-cyan-800 underline"><Link href="/terms">{kz ? "Жалдау шарттары" : "Условия аренды"}</Link><Link href="/about">{kz ? "Мекенжай және байланыс" : "Адрес и контакты"}</Link></div>
          </div>
        </div>
        <h2 className="mt-10 text-2xl font-bold text-gray-900">{kz ? "Автокөлікті таңдаңыз" : "Выберите автомобиль"}</h2>
        {model.cars.length ? <CatalogGrid cars={model.cars} /> : <p className="mt-4 text-gray-600">{kz ? "Бұл модель уақытша қолжетімсіз. Менеджер балама автокөлік ұсынады." : "Эта модель временно отсутствует в каталоге. Менеджер поможет подобрать альтернативу."}</p>}
      </div>
    </main>
  );
}
