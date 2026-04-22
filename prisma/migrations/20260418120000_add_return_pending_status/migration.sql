-- AlterEnum
-- Adds new RETURN_PENDING value to BookingStatus enum.
-- Clients upload return photos → booking moves to RETURN_PENDING → manager approves in CRM → sync promotes to COMPLETED.
ALTER TYPE "BookingStatus" ADD VALUE 'RETURN_PENDING' AFTER 'ACTIVE';
