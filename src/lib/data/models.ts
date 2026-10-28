import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { PUBLIC_CAR_WHERE } from "./cars";

export const getPublicModels = cache(() => prisma.carModel.findMany({
  where: { cars: { some: PUBLIC_CAR_WHERE } }, include: { brand: true }, orderBy: { name: "asc" },
}));

// No availability filter: a model URL remains useful when its cars are rented.
export const getPublicModel = cache((slug: string) => prisma.carModel.findUnique({
  where: { slug },
  include: { brand: true, cars: {
    where: PUBLIC_CAR_WHERE,
    include: { model: { include: { brand: true } }, photos: { include: { photo: true }, orderBy: { sortOrder: "asc" } }, tariff: { include: { tiers: true } } },
    orderBy: [{ pricePerDay: "asc" }, { year: "desc" }],
  } },
}));
