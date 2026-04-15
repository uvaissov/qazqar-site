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

export async function getGroupedCars(filters?: Parameters<typeof getCars>[0]) {
  const cars = await getCars(filters);

  const groups = new Map<string, typeof cars>();
  for (const car of cars) {
    const key = `${car.modelId}-${car.year}-${car.color}-${car.pricePerDay}`;
    const group = groups.get(key);
    if (group) {
      group.push(car);
    } else {
      groups.set(key, [car]);
    }
  }

  const grouped = Array.from(groups.values()).map((group) => {
    const available = group.find((c) => c.status === "AVAILABLE");
    const representative = available || group[0];
    const availableCount = group.filter((c) => c.status === "AVAILABLE").length;
    return { ...representative, availableCount, totalCount: group.length };
  });

  // Свободные авто первыми, затем по количеству доступных (убывание)
  grouped.sort((a, b) => {
    const aFree = a.status === "AVAILABLE" ? 1 : 0;
    const bFree = b.status === "AVAILABLE" ? 1 : 0;
    if (aFree !== bFree) return bFree - aFree;
    return b.availableCount - a.availableCount;
  });

  return grouped;
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
