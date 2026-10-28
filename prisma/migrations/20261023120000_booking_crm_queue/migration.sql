-- Очередь отправки заявок в Yume и защита от повторной отправки формы
-- (docs/plans/2026-10-23-booking-crm-queue-design.md).
CREATE TYPE "CrmSyncStatus" AS ENUM ('PENDING', 'DONE', 'FAILED');

ALTER TABLE "bookings" ADD COLUMN "idempotencyKey" TEXT;
ALTER TABLE "bookings" ADD COLUMN "crmSyncStatus" "CrmSyncStatus";
ALTER TABLE "bookings" ADD COLUMN "crmSyncError" TEXT;
ALTER TABLE "bookings" ADD COLUMN "crmSyncAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "bookings" ADD COLUMN "crmSyncNextAt" TIMESTAMP(3);
ALTER TABLE "bookings" ADD COLUMN "crmComment" TEXT;
ALTER TABLE "bookings" ADD COLUMN "telegramMessageId" INTEGER;

CREATE UNIQUE INDEX "bookings_idempotencyKey_key" ON "bookings"("idempotencyKey");
CREATE INDEX "bookings_crmSyncStatus_crmSyncNextAt_idx" ON "bookings"("crmSyncStatus", "crmSyncNextAt");
