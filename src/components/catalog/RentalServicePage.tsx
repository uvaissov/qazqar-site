import { getGroupedCars } from "@/lib/data/cars";
import { getSeasonBounds, findTier, seasonFor, tierPrice } from "@/lib/pricing";
import CatalogGrid from "@/components/catalog/CatalogGrid";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbData, SITE_URL } from "@/lib/seo";
import { Link } from "@/i18n/routing";

export const rentalServices = {
  month: {
    path: "/rent-month",
    ru: { title: "Аренда авто на месяц в Астане", description: "Прокат автомобиля на 30 дней: сравните машины и тарифы на длительный срок. Выберите автомобиль в каталоге и рассчитайте стоимость на ваши даты.", intro: "Для аренды на месяц выбирайте автомобиль с тарифом на 30 дней. Ниже показаны подходящие машины. Цена суток для длительного срока может отличаться от базовой цены в каталоге.", conditions: "В карточке автомобиля выберите даты на 30 дней. Расчёт покажет стоимость аренды, депозит и надбавку при выборе аренды без депозита. Продление и более длительный срок согласуйте с менеджером; доступность проверяется на конкретные даты.", priceTitle: "Стоимость аренды на 30 дней", question: "Как рассчитывается цена на месяц?", answer: "По тарифу выбранного автомобиля, длительности и сезону начала аренды. В форме бронирования отображается полный расчёт; депозит указывается отдельно." },
    kz: { title: "Астанада бір айға автокөлік жалдау", description: "30 күнге автокөлік жалдау: көліктер мен ұзақ мерзімді тарифтерді салыстырыңыз. Каталогтан автокөлікті таңдап, күндеріңізге бағаны есептеңіз.", intro: "Бір айға жалдау үшін 30 күндік тарифі бар автокөлікті таңдаңыз. Төменде сәйкес көліктер көрсетілген. Ұзақ мерзімдегі күндік баға каталогтағы базалық бағадан өзгеше болуы мүмкін.", conditions: "Автокөлік бетінде 30 күндік мерзімді таңдаңыз. Есепте жалдау бағасы, депозит және депозитсіз жалдау үстемесі көрсетіледі. Ұзарту және одан ұзақ мерзім менеджермен келісіледі; қолжетімділік нақты күндерге тексеріледі.", priceTitle: "30 күнге жалдау бағасы", question: "Бір айға баға қалай есептеледі?", answer: "Таңдалған автокөлік тарифіне, мерзімге және жалдау басталатын маусымға қарай есептеледі. Брондау нысанында толық есеп, ал депозит бөлек көрсетіледі." },
  },
  noDeposit: {
    path: "/rent-without-deposit",
    ru: { title: "Аренда авто без депозита в Астане — условия", description: "Как арендовать автомобиль без депозита в Qazqar: условия, надбавка по сроку и расчёт полной стоимости перед бронированием.", intro: "В форме бронирования можно выбрать аренду без депозита. Если для машины предусмотрен депозит, при отказе от него добавляется надбавка. Это платная опция, а не обещание аренды по той же цене без залога.", conditions: "Выберите машину и даты, затем вариант «без депозита». Надбавка зависит от суммы депозита, срока аренды и действующих настроек тарифа. Полная стоимость отображается до отправки заявки. Отсутствие депозита не отменяет требования к документам и обязательства по договору.", priceTitle: "Автомобили и базовые тарифы", question: "Аренда без депозита стоит столько же?", answer: "Для автомобилей с депозитом предусмотрена надбавка. Её размер рассчитывается на выбранный срок и показывается в форме бронирования отдельно от аренды." },
    kz: { title: "Астанада депозитсіз автокөлік жалдау — шарттар", description: "Qazqar-да депозитсіз автокөлік жалдау: шарттар, мерзімге байланысты үстеме ақы және брондау алдында толық бағаны есептеу.", intro: "Брондау нысанында депозитсіз жалдауды таңдауға болады. Автокөлікке депозит қарастырылса, одан бас тартқанда үстеме ақы қосылады. Бұл — ақылы опция; депозитсіз жалдау бағасы бірдей болады деген уәде емес.", conditions: "Автокөлік пен күндерді таңдап, депозитсіз нұсқаны белгілеңіз. Үстеме ақы депозит сомасына, жалдау мерзіміне және тариф баптауларына байланысты. Толық баға өтінім жіберілгенге дейін көрсетіледі. Депозиттің болмауы құжат талаптарын және шарт бойынша міндеттерді жоймайды.", priceTitle: "Автокөліктер және базалық тарифтер", question: "Депозитсіз жалдау бағасы бірдей ме?", answer: "Депозиті бар автокөліктерге үстеме ақы қарастырылған. Ол таңдалған мерзімге есептеліп, брондау нысанында жалдау бағасынан бөлек көрсетіледі." },
  },
};

export default async function RentalServicePage({ locale, service }: { locale: string; service: keyof typeof rentalServices }) {
  const config = rentalServices[service];
  const kz = locale === "kz";
  const text = kz ? config.kz : config.ru;
  const season = seasonFor(new Date(), await getSeasonBounds());
  const cars = (await getGroupedCars()).filter(car => car.tariff?.active && car.tariff.tiers.length && (service !== "month" || findTier(car.tariff, 30)));
  return (
    <main className="min-h-screen bg-gray-50 pb-16">
      <JsonLd data={breadcrumbData([{ name: kz ? "Басты бет" : "Главная", path: `/${locale}` }, { name: text.title, path: `/${locale}${config.path}` }])} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Service", name: text.title, serviceType: "Car rental", areaServed: { "@type": "City", name: "Астана" }, provider: { "@id": `${SITE_URL}/#business` }, url: `${SITE_URL}/${locale}${config.path}` }} />
      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{text.title}</h1>
        <div className="mt-7">
          <div className="max-w-4xl space-y-5 text-gray-700">
            <p>{text.intro}</p><h2 className="text-2xl font-bold text-gray-900">{kz ? "Шарттар мен есеп" : "Условия и расчёт"}</h2><p>{text.conditions}</p>
            <h2 className="text-xl font-bold text-gray-900">{text.question}</h2><p>{text.answer}</p>
            <div className="flex flex-wrap gap-4 text-cyan-800 underline"><Link href="/terms">{kz ? "Жалдау шарттары" : "Условия аренды"}</Link><Link href="/about">{kz ? "Мекенжай және байланыс" : "Адрес и контакты"}</Link><Link href={service === "month" ? "/rent-without-deposit" : "/rent-month"}>{kz ? "Басқа жалдау нұсқалары" : "Другие варианты аренды"}</Link></div>
          </div>
        </div>
        <h2 className="mt-10 text-2xl font-bold text-gray-900">{text.priceTitle}</h2>
        {service === "month" && cars.length > 0 && <ul className="mt-4 space-y-2">{cars.map(car => {
          const price = tierPrice(findTier(car.tariff!, 30)!, season);
          return <li key={car.id}><Link href={`/catalog/${car.slug}`} className="text-cyan-800 underline">{car.model.brand.name} {car.model.name} {car.year}</Link> — {price.toLocaleString(kz ? "kk-KZ" : "ru-RU")} ₸ {kz ? "/ тәулік" : "/ сутки"}, {(price * 30).toLocaleString(kz ? "kk-KZ" : "ru-RU")} ₸ {kz ? "30 күндік жалдау бағасы; депозит пен үстеме ақы бөлек" : "за 30 дней аренды; депозит и надбавки отдельно"}.</li>;
        })}</ul>}
        <CatalogGrid cars={cars} />
      </div>
    </main>
  );
}
