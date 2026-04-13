import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCarBySlug, getSimilarCars, getCarImages } from "@/lib/data/cars";
import { getDiscounts } from "@/lib/data/content";
import JsonLd from "@/components/seo/JsonLd";
import CarGallery from "@/components/car/CarGallery";
import CarSpecs from "@/components/car/CarSpecs";
import BookingForm from "@/components/car/BookingForm";
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
  if (!car) return {};

  const brandModel = `${car.model.brand.name} ${car.model.name}`;
  const title =
    locale === "kz"
      ? `${brandModel} ${car.year} — Астанада жалға алу | Qazqar`
      : `${brandModel} ${car.year} — Аренда в Астане | Qazqar`;
  const description =
    locale === "kz"
      ? `${brandModel} жалға алу | Qazqar`
      : `Аренда ${brandModel} в Астане | Qazqar`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: car.photos.length > 0 ? [{ url: car.photos[0].photo.url }] : [],
    },
    alternates: {
      languages: {
        ru: `/ru/catalog/${car.slug}`,
        kk: `/kz/catalog/${car.slug}`,
      },
    },
  };
}

export default async function CarDetailPage({
  params,
  searchParams: searchParamsPromise,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ dateFrom?: string; dateTo?: string }>;
}) {
  const [{ slug }, searchParams] = await Promise.all([params, searchParamsPromise]);

  const car = await getCarBySlug(slug);
  if (!car) notFound();

  const [similarCars, discounts, t] = await Promise.all([
    getSimilarCars(car.id, car.modelId),
    getDiscounts(),
    getTranslations("nav"),
  ]);

  const title = `${car.model.brand.name} ${car.model.name} ${car.year}`;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: `${car.model.brand.name} ${car.model.name} ${car.year}`,
          description:
            car.descriptionRu ||
            `Аренда ${car.model.brand.name} ${car.model.name} в Астане`,
          image: car.photos[0]?.photo.url || undefined,
          offers: {
            "@type": "Offer",
            priceCurrency: "KZT",
            availability: "https://schema.org/InStock",
          },
        }}
      />
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
              <span className="text-gray-900">{car.model.brand.name} {car.model.name}</span>
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
            </div>

            {/* Right column: Booking form (Sticky) */}
            <div className="lg:col-span-4">
              <div className="sticky top-24">
                <BookingForm
                  carId={car.id}
                  pricePerDay={car.pricePerDay}
                  discounts={discounts}
                  initialDateFrom={searchParams.dateFrom}
                  initialDateTo={searchParams.dateTo}
                />
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
