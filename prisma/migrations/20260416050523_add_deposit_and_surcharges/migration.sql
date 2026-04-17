-- AlterTable
ALTER TABLE "cars" ADD COLUMN     "deposit" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "no_deposit_surcharges" (
    "id" TEXT NOT NULL,
    "minDays" INTEGER NOT NULL,
    "maxDays" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "no_deposit_surcharges_pkey" PRIMARY KEY ("id")
);
