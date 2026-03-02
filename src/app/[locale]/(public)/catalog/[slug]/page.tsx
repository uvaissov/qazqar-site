import { notFound } from "next/navigation";
import { getCarBySlug, getSimilarCars } from "@/lib/data/cars";
import { getDiscounts } from "@/lib/data/content";
import CarGallery from "@/components/car/CarGallery";
import CarSpecs from "@/components/car/CarSpecs";
import BookingForm from "@/components/car/BookingForm";
import SimilarCars from "@/components/car/SimilarCars";
import { Link } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const car = await getCarBySlug(slug);
  if (!car) return {};

  const title = `${car.model.brand.name} ${car.model.name} ${car.year} — Аренда в Астане | Qazqar`;
  return {
    title,
    description: `Аренда ${car.model.brand.name} ${car.model.name} от ${car.pricePerDay} ₸/сутки`,
  };
}

export default async function CarDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;

  const car = await getCarBySlug(slug);
  if (!car) notFound();

  const [similarCars, discounts] = await Promise.all([
    getSimilarCars(car.id, car.modelId),
    getDiscounts(),
  ]);

  const title = `${car.model.brand.name} ${car.model.name} ${car.year}`;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/catalog" className="hover:text-cyan-500 transition-colors">
              Каталог
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{title}</span>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column: Gallery + Specs */}
          <div className="lg:col-span-2 space-y-8">
            <CarGallery images={car.images} title={title} />
            <CarSpecs car={car} />
          </div>

          {/* Right column: Booking form */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <BookingForm
                carId={car.id}
                pricePerDay={car.pricePerDay}
                discounts={discounts}
              />
            </div>
          </div>
        </div>

        {/* Similar cars */}
        <SimilarCars cars={similarCars} />
      </div>
    </main>
  );
}
