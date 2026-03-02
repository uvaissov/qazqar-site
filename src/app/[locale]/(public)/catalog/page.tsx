import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCars, getBrands } from "@/lib/data/cars";
import CatalogFilters from "@/components/catalog/CatalogFilters";
import CatalogGrid from "@/components/catalog/CatalogGrid";
import { BentoGrid, BentoCard } from "@/components/ui/BentoGrid";
import { Car, Search } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("catalogPage");
  return {
    title: `${t("metaTitle")} | Qazqar`,
    description: t("metaDescription"),
  };
}

export default async function CatalogPage(props: {
  searchParams: Promise<{
    brand?: string;
    minPrice?: string;
    maxPrice?: string;
    transmission?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const t = await getTranslations("catalogPage");

  const filters = {
    brandSlug: searchParams.brand || undefined,
    minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
    transmission: searchParams.transmission || undefined,
  };

  const [cars, brands] = await Promise.all([getCars(filters), getBrands()]);

  return (
    <main className="min-h-screen bg-gray-50/50 pb-20">
      {/* Page header - Bento Style */}
      <section className="py-10 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BentoGrid className="md:auto-rows-[160px]">
             <BentoCard colSpan={3} rowSpan={1} className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-none flex flex-row items-center justify-between overflow-hidden">
                <div className="relative z-10">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight">{t("title")}</h1>
                  <p className="mt-2 text-cyan-50/80 font-medium">{t("subtitle")}</p>
                </div>
                <div className="hidden md:block opacity-20 -mr-10">
                   <Car size={200} strokeWidth={0.5} />
                </div>
             </BentoCard>
             
             <BentoCard colSpan={1} rowSpan={1} className="bg-white flex flex-col items-center justify-center text-center group">
                <div className="w-12 h-12 bg-cyan-50 text-cyan-600 rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                   <Search className="w-6 h-6" />
                </div>
                <span className="text-2xl font-black text-gray-900">{cars.length}</span>
                <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">{t("carsCount")}</span>
             </BentoCard>
          </BentoGrid>
        </div>
      </section>

      {/* Filters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <CatalogFilters brands={brands} />
      </section>

      {/* Car grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <CatalogGrid cars={cars} />
      </section>
    </main>
  );
}
