-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "pickupAddressId" TEXT,
ADD COLUMN     "returnAddressId" TEXT;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_pickupAddressId_fkey" FOREIGN KEY ("pickupAddressId") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_returnAddressId_fkey" FOREIGN KEY ("returnAddressId") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
