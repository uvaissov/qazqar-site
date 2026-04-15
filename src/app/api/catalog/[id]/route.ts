import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const car = await prisma.car.findUnique({
      where: { id },
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
    });

    if (!car) {
      // Try by slug
      const bySlug = await prisma.car.findUnique({
        where: { slug: id },
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
      });

      if (!bySlug) {
        return NextResponse.json({ error: "Car not found" }, { status: 404 });
      }

      return NextResponse.json(formatCar(bySlug));
    }

    return NextResponse.json(formatCar(car));
  } catch (error) {
    console.error("Catalog item error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function formatCar(car: any) {
  return {
    id: car.id,
    slug: car.slug,
    year: car.year,
    color: car.color,
    transmission: car.transmission,
    fuelType: car.fuelType,
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
    photos: car.photos.map((cp: any) => cp.photo.url),
  };
}
