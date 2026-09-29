-- Ручное скрытие авто из витрины (галочка в админке). Синк CRM поле не трогает.
ALTER TABLE "cars" ADD COLUMN "isHidden" BOOLEAN NOT NULL DEFAULT false;
