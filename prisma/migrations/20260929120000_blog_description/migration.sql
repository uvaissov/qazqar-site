-- meta description статей блога (перенос со старого сайта qazqar.kz, где оно было у каждой статьи).
ALTER TABLE "blog_posts" ADD COLUMN "descriptionRu" TEXT NOT NULL DEFAULT '';
ALTER TABLE "blog_posts" ADD COLUMN "descriptionKz" TEXT NOT NULL DEFAULT '';
