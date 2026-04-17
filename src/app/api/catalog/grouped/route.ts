import { getGroupedCars } from "@/lib/data/cars";
import { fuelTypeLabel, transmissionLabel } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const cars = await getGroupedCars({
      brandSlug: searchParams.get("brand") ?? undefined,
      transmission: searchParams.get("transmission") ?? undefined,
      priceMin: searchParams.get("priceMin") ? parseInt(searchParams.get("priceMin")!) : undefined,
      priceMax: searchParams.get("priceMax") ? parseInt(searchParams.get("priceMax")!) : undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
    });

    const result = cars.map((car) => ({
      id: car.id,
      slug: car.slug,
      year: car.year,
      color: car.color,
      transmission: car.transmission,
      transmissionLabel: transmissionLabel(car.transmission),
      fuelType: car.fuelType,
      fuelTypeLabel: fuelTypeLabel(car.fuelType),
      seats: car.seats,
      hasAC: car.hasAC,
      pricePerDay: car.pricePerDay,
      status: car.status,
      availableCount: car.availableCount,
      totalCount: car.totalCount,
      nextBookingAt: car.nextBookingAt,
      availableFrom: car.availableFrom,
      descriptionRu: car.descriptionRu,
      descriptionKz: car.descriptionKz,
      modelName: car.model.name,
      brand: {
        id: car.model.brand.id,
        name: car.model.brand.name,
        slug: car.model.brand.slug,
        logoUrl: car.model.brand.logo,
      },
      photos: car.photos.map((cp) => cp.photo.url),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Grouped catalog error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
