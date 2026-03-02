import { prisma } from "@/lib/prisma";

export async function getCars(filters?: {
  brandSlug?: string;
  minPrice?: number;
  maxPrice?: number;
  transmission?: string;
}) {
  const where: any = { status: "AVAILABLE" };
  if (filters?.brandSlug) {
    where.model = { brand: { slug: filters.brandSlug } };
  }
  if (filters?.minPrice || filters?.maxPrice) {
    where.pricePerDay = {};
    if (filters.minPrice) where.pricePerDay.gte = filters.minPrice;
    if (filters.maxPrice) where.pricePerDay.lte = filters.maxPrice;
  }
  if (filters?.transmission) {
    where.transmission = filters.transmission;
  }

  return prisma.car.findMany({
    where,
    include: { model: { include: { brand: true } } },
    orderBy: { pricePerDay: "asc" },
  });
}

export async function getCarBySlug(slug: string) {
  return prisma.car.findUnique({
    where: { slug },
    include: { model: { include: { brand: true } } },
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
    include: { model: { include: { brand: true } } },
    take: limit,
  });
}
