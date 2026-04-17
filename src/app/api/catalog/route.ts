import { prisma } from "@/lib/prisma";
import { fuelTypeLabel, transmissionLabel } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const brandId = searchParams.get("brandId");
    const transmission = searchParams.get("transmission");
    const fuelType = searchParams.get("fuelType");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const minSeats = searchParams.get("minSeats");
    const dateStart = searchParams.get("dateStart");
    const dateEnd = searchParams.get("dateEnd");

    const where: Record<string, unknown> = {
      status: "AVAILABLE",
    };

    if (transmission) {
      where.transmission = transmission;
    }

    if (fuelType) {
      where.fuelType = fuelType;
    }

    if (minSeats) {
      where.seats = { gte: parseInt(minSeats) };
    }

    if (minPrice || maxPrice) {
      where.pricePerDay = {
        ...(minPrice && { gte: parseInt(minPrice) }),
        ...(maxPrice && { lte: parseInt(maxPrice) }),
      };
    }

    if (brandId) {
      where.model = { brandId };
    }

    // If dates provided, exclude cars with conflicting bookings
    if (dateStart && dateEnd) {
      const start = new Date(dateStart);
      const end = new Date(dateEnd);

      where.bookings = {
        none: {
          status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] },
          startDate: { lt: end },
          endDate: { gt: start },
        },
      };
    }

    const cars = await prisma.car.findMany({
      where,
      include: {
        model: {
          include: {
            brand: true,
          },
        },
        photos: {
          include: { photo: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { pricePerDay: "asc" },
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
      descriptionRu: car.descriptionRu,
      descriptionKz: car.descriptionKz,
      modelName: car.model.name,
      brand: {
        id: car.model.brand.id,
        name: car.model.brand.name,
        logoUrl: car.model.brand.logo,
      },
      photos: car.photos.map((cp) => cp.photo.url),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Catalog error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
