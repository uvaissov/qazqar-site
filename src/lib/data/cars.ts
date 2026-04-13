import { prisma } from "@/lib/prisma";

const carInclude = {
  model: { include: { brand: true } },
  photos: { include: { photo: true }, orderBy: { sortOrder: "asc" as const } },
};

// Helper: extract image URLs from car photos relation
export function getCarImages(car: { photos: { photo: { url: string } }[] }): string[] {
  return car.photos.map((cp) => cp.photo.url);
}

export async function getCars(filters?: {
  brandSlug?: string;
  transmission?: string;
  priceMin?: number;
  priceMax?: number;
  dateFrom?: string;
  dateTo?: string;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (filters?.brandSlug) {
    where.model = { brand: { slug: filters.brandSlug } };
  }
  if (filters?.transmission) {
    where.transmission = filters.transmission;
  }
  if (filters?.priceMin || filters?.priceMax) {
    where.pricePerDay = {};
    if (filters.priceMin) where.pricePerDay.gte = filters.priceMin;
    if (filters.priceMax) where.pricePerDay.lte = filters.priceMax;
  }
  if (filters?.dateFrom && filters?.dateTo) {
    const from = new Date(filters.dateFrom);
    const to = new Date(filters.dateTo);
    if (from < to) {
      // Car must be available or will free up by dateFrom
      where.OR = [
        { status: "AVAILABLE" },
        { status: "RENTED", availableFrom: { lte: from } },
      ];
      // No overlapping active bookings
      where.bookings = {
        none: {
          status: { not: "CANCELLED" },
          startDate: { lt: to },
          endDate: { gt: from },
        },
      };
    }
  }

  return prisma.car.findMany({
    where,
    include: carInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getCarBySlug(slug: string) {
  return prisma.car.findUnique({
    where: { slug },
    include: carInclude,
  });
}

export async function getBrands() {
  return prisma.carBrand.findMany({
    include: { models: true },
    orderBy: { name: "asc" },
  });
}

export async function getSimilarCars(carId: string, modelId: string, limit = 3) {
  return prisma.car.findMany({
    where: { modelId, id: { not: carId }, status: "AVAILABLE" },
    include: carInclude,
    take: limit,
  });
}
