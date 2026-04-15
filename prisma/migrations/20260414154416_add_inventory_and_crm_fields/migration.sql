/*
  Warnings:

  - You are about to drop the column `images` on the `cars` table. All the data in the column will be lost.
  - You are about to drop the column `licensePlate` on the `cars` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[requestId]` on the table `bookings` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[inventoryId]` on the table `cars` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[number]` on the table `cars` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[iin]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[clientId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `inventoryId` to the `cars` table without a default value. This is not possible if the table is not empty.
  - Added the required column `number` to the `cars` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OtpType" AS ENUM ('REGISTER', 'RESET_PASSWORD', 'LOGIN');

-- DropIndex
DROP INDEX "cars_licensePlate_key";

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "documents" JSONB,
ADD COLUMN     "requestId" INTEGER;

-- AlterTable
ALTER TABLE "cars" DROP COLUMN "images",
DROP COLUMN "licensePlate",
ADD COLUMN     "availableFrom" TIMESTAMP(3),
ADD COLUMN     "inventoryId" INTEGER NOT NULL,
ADD COLUMN     "nextBookingAt" TIMESTAMP(3),
ADD COLUMN     "number" TEXT NOT NULL,
ADD COLUMN     "techPassport" TEXT,
ADD COLUMN     "totalDistance" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "vin" TEXT,
ALTER COLUMN "pricePerDay" SET DEFAULT 15000;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "clientId" INTEGER,
ADD COLUMN     "iin" TEXT,
ADD COLUMN     "isResident" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "photos" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "car_photos" (
    "carId" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "car_photos_pkey" PRIMARY KEY ("carId","photoId")
);

-- CreateTable
CREATE TABLE "otp_codes" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "OtpType" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "photos_url_key" ON "photos"("url");

-- CreateIndex
CREATE INDEX "otp_codes_email_code_type_idx" ON "otp_codes"("email", "code", "type");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_requestId_key" ON "bookings"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "cars_inventoryId_key" ON "cars"("inventoryId");

-- CreateIndex
CREATE UNIQUE INDEX "cars_number_key" ON "cars"("number");

-- CreateIndex
CREATE UNIQUE INDEX "users_iin_key" ON "users"("iin");

-- CreateIndex
CREATE UNIQUE INDEX "users_clientId_key" ON "users"("clientId");

-- AddForeignKey
ALTER TABLE "car_photos" ADD CONSTRAINT "car_photos_carId_fkey" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_photos" ADD CONSTRAINT "car_photos_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "photos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
