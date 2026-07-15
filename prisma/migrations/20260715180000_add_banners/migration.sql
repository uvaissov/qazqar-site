-- Баннеры карусели на главной мобильного приложения.
-- Только картинка + внешняя ссылка: текст запекает дизайнер в изображение.
-- locale NULL = показывать на обоих языках.
-- CreateTable
CREATE TABLE "banners" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT,
    "locale" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "banners_active_sortOrder_idx" ON "banners"("active", "sortOrder");
