import { pageAlternates, breadcrumbData, SITE_URL } from "@/lib/seo";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCarBySlug, getSimilarCars, getCarImages } from "@/lib/data/cars";
import { getSeasonBounds, seasonFor, sortedTiers, tariffMaxDays, tierPrice } from "@/lib/pricing";
import JsonLd from "@/components/seo/JsonLd";
import CarGallery from "@/components/car/CarGallery";
import CarSpecs from "@/components/car/CarSpecs";
import BookingForm from "@/components/car/BookingForm";
import TariffTable from "@/components/car/TariffTable";
import SimilarCars from "@/components/car/SimilarCars";
import { Link } from "@/i18n/routing";
import { ChevronRight } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const car = await getCarBySlug(slug);
  if (!car) notFound();

  const brandModel = `${car.model.brand.name} ${car.model.name}`;
  const title =
    locale === "kz"
      ? `${brandModel} ${car.year} — Астанада жалға алу | Qazqar`
      : `${brandModel} ${car.year} — Аренда в Астане | Qazqar`;
  const description =
    locale === "kz"
      ? `${brandModel} ${car.year}: тәулігіне ${car.pricePerDay.toLocaleString("kk-KZ")} ₸. Мерзім бойынша тарифтер мен жалдау шарттарын қарап, күндеріңізге есеп алыңыз.`
      : `Аренда ${brandModel} ${car.year} в Астане: ${car.pricePerDay.toLocaleString("ru-RU")} ₸/сутки по базовому тарифу. Тарифы по срокам и расчёт на ваши даты.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `/${locale}/catalog/${car.slug}`,
      images: car.photos.length > 0 ? [{ url: car.photos[0].photo.url }] : [],
    },
    alternates: pageAlternates(locale, `/catalog/${car.slug}`),
  };
}

export default async function CarDetailPage({
  params,
  searchParams: searchParamsPromise,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ dateFrom?: string; dateTo?: string }>;
}) {
  const [{ locale, slug }, searchParams] = await Promise.all([params, searchParamsPromise]);

  const car = await getCarBySlug(slug);
  if (!car) notFound();

  const [similarCars, seasonBounds, t] = await Promise.all([
    getSimilarCars(car.id, car.modelId),
    getSeasonBounds(),
    getTranslations("nav"),
  ]);

  // Сетка текущего сезона — для таблицы под формой; точную цену на даты
  // форма запрашивает у /api/catalog/[id]/price
  const season = seasonFor(new Date(), seasonBounds);
  const tariff =
    car.tariff && car.tariff.active && car.tariff.tiers.length > 0
      ? {
          maxDays: tariffMaxDays(car.tariff),
          tiers: sortedTiers(car.tariff).map((tier) => ({
            minDays: tier.minDays,
            maxDays: tier.maxDays,
            pricePerDay: tierPrice(tier, season),
          })),
        }
      : null;

  const title = `${car.model.brand.name} ${car.model.name} ${car.year}`;
  const kz = locale === "kz";
  const description = (kz ? car.descriptionKz : car.descriptionRu) || (kz ? `${title} Астанада жалдау` : `Аренда ${title} в Астане`);
  const oneDayTier = car.tariff?.active ? car.tariff.tiers.find(tier => tier.minDays <= 1 && tier.maxDays >= 1) : undefined;
  const price = oneDayTier ? tierPrice(oneDayTier, season) : undefined;
  const breadcrumbs = [
    { name: kz ? "Басты бет" : "Главная", path: `/${locale}` },
    { name: "Каталог", path: `/${locale}/catalog` },
    { name: `${car.model.brand.name} ${car.model.name}`, path: `/${locale}/cars/${car.model.slug}` },
    { name: `${title} · ${car.color}`, path: `/${locale}/catalog/${car.slug}` },
  ];

  return (
    <>
      {price !== undefined && <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: `${car.model.brand.name} ${car.model.name} ${car.year}`,
          description,
          image: car.photos[0]?.photo.url || undefined,
          ...(price !== undefined && { offers: {
            "@type": "Offer", url: `${SITE_URL}/${locale}/catalog/${car.slug}`,
            price, priceCurrency: "KZT",
            businessFunction: "http://purl.org/goodrelations/v1#LeaseOut",
            availability: car.status === "AVAILABLE" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            priceSpecification: { "@type": "UnitPriceSpecification", price, priceCurrency: "KZT", unitText: kz ? "тәулік" : "сутки" },
          } }),
        }}
      />}
      <JsonLd data={breadcrumbData(breadcrumbs)} />
      <main className="min-h-screen bg-gray-50/50 pb-20 relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-cyan-100/30 rounded-full blur-[100px] pointer-events-none -mr-40 -mt-40" />

        {/* Breadcrumb */}
        <div className="pt-8 pb-4 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm text-xs font-bold uppercase tracking-widest text-gray-400">
              <Link href="/catalog" className="hover:text-cyan-600 transition-colors">
                {t("catalog")}
              </Link>
              <ChevronRight className="w-3 h-3" />
              <Link href={`/cars/${car.model.slug}`} className="text-gray-900 hover:text-cyan-700">{car.model.brand.name} {car.model.name}</Link>
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left column: Gallery + Specs (Bigger portion) */}
            <div className="lg:col-span-8 space-y-8">
              <CarGallery images={getCarImages(car)} title={title} />
              <CarSpecs car={car} />
              <p className="px-3 text-gray-700">{description}</p>
              <div className="flex gap-4 px-3 text-cyan-800 underline"><Link href="/terms">{kz ? "Жалдау шарттары" : "Условия аренды"}</Link><Link href="/about">{kz ? "Мекенжай және байланыс" : "Адрес и контакты"}</Link></div>
            </div>

            {/* Right column: Booking form (Sticky) */}
            <div className="lg:col-span-4">
              <div className="sticky top-24 space-y-4">
                <BookingForm
                  carId={car.id}
                  deposit={car.deposit > 0 ? car.deposit : (car.tariff?.deposit ?? 0)}
                  bookable={tariff !== null}
                  initialDateFrom={searchParams.dateFrom}
                  initialDateTo={searchParams.dateTo}
                />
                <TariffTable tariff={tariff} season={season} />
              </div>
            </div>
          </div>

          {/* Similar cars */}
          <SimilarCars cars={similarCars} />
        </div>
      </main>
    </>
  );
}
