-- Тарифная сетка вместо скидок: docs/plans/2026-09-20-tariff-grid-design.md
CREATE TABLE "tariffs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "deposit" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tariffs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tariff_tiers" (
    "id" TEXT NOT NULL,
    "tariffId" TEXT NOT NULL,
    "minDays" INTEGER NOT NULL,
    "maxDays" INTEGER NOT NULL,
    "priceSummer" INTEGER NOT NULL,
    "priceWinter" INTEGER NOT NULL,

    CONSTRAINT "tariff_tiers_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "cars" ADD COLUMN "tariffId" TEXT;

CREATE UNIQUE INDEX "tariffs_name_key" ON "tariffs"("name");
CREATE UNIQUE INDEX "tariff_tiers_tariffId_minDays_key" ON "tariff_tiers"("tariffId", "minDays");
CREATE INDEX "cars_tariffId_idx" ON "cars"("tariffId");

ALTER TABLE "tariff_tiers" ADD CONSTRAINT "tariff_tiers_tariffId_fkey" FOREIGN KEY ("tariffId") REFERENCES "tariffs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cars" ADD CONSTRAINT "cars_tariffId_fkey" FOREIGN KEY ("tariffId") REFERENCES "tariffs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
