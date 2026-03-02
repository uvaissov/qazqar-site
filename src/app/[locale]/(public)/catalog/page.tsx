import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCars, getBrands } from "@/lib/data/cars";
import CatalogFilters from "@/components/catalog/CatalogFilters";
import CatalogGrid from "@/components/catalog/CatalogGrid";

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
    <main className="min-h-screen bg-gray-50">
      {/* Page header */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
          <p className="mt-2 text-gray-600">{t("subtitle")}</p>
        </div>
      </section>

      {/* Filters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <CatalogFilters brands={brands} />
      </section>

      {/* Car grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <CatalogGrid cars={cars} />
      </section>
    </main>
  );
}
