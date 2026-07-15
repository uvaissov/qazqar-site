/*
  Warnings:

  - You are about to drop the column `active` on the `no_deposit_surcharges` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `no_deposit_surcharges` table. All the data in the column will be lost.
  - You are about to drop the column `maxDays` on the `no_deposit_surcharges` table. All the data in the column will be lost.
  - You are about to drop the column `minDays` on the `no_deposit_surcharges` table. All the data in the column will be lost.
  - Added the required column `maxDay` to the `no_deposit_surcharges` table without a default value. This is not possible if the table is not empty.
  - Added the required column `minDay` to the `no_deposit_surcharges` table without a default value. This is not possible if the table is not empty.
  - Added the required column `percent` to the `no_deposit_surcharges` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RemoteAction" AS ENUM ('UNLOCK', 'LOCK');

-- DropIndex
DROP INDEX "users_clientId_key";

-- DropIndex
DROP INDEX "users_iin_key";

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "depositAmount" INTEGER,
ADD COLUMN     "depositLabel" TEXT,
ADD COLUMN     "pickupDocuments" JSONB,
ADD COLUMN     "withDeposit" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "cars" ADD COLUMN     "hasRemote" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "remotePhone" TEXT;

-- AlterTable
ALTER TABLE "no_deposit_surcharges" DROP COLUMN "active",
DROP COLUMN "amount",
DROP COLUMN "maxDays",
DROP COLUMN "minDays",
ADD COLUMN     "maxDay" INTEGER NOT NULL,
ADD COLUMN     "minDay" INTEGER NOT NULL,
ADD COLUMN     "percent" DOUBLE PRECISION NOT NULL;

-- CreateTable
CREATE TABLE "app_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remote_commands" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "RemoteAction" NOT NULL,
    "targetPhone" TEXT NOT NULL,
    "smsText" TEXT NOT NULL,
    "providerId" TEXT,
    "ok" BOOLEAN NOT NULL DEFAULT true,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "remote_commands_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_settings_key_key" ON "app_settings"("key");

-- CreateIndex
CREATE INDEX "remote_commands_bookingId_createdAt_idx" ON "remote_commands"("bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "remote_commands_userId_createdAt_idx" ON "remote_commands"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "remote_commands_createdAt_idx" ON "remote_commands"("createdAt");

-- AddForeignKey
ALTER TABLE "remote_commands" ADD CONSTRAINT "remote_commands_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_commands" ADD CONSTRAINT "remote_commands_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
