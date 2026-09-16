-- Источник заявки: сайт / мобильное приложение / заведена в CRM.
-- Исторические заявки помечаются SITE — до этой миграции источник не хранился,
-- восстановить его задним числом нельзя.
CREATE TYPE "BookingSource" AS ENUM ('SITE', 'MOBILE', 'CRM');
ALTER TABLE "bookings" ADD COLUMN "source" "BookingSource" NOT NULL DEFAULT 'SITE';
