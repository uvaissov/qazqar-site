# Qazqar Stage 1: Foundation — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create the project foundation — Next.js app, Docker Compose (PostgreSQL + MinIO), Prisma schema with all models, migrations, seed data, and base layout (header + footer).

**Architecture:** Fullstack Next.js 15 App Router monorepo. PostgreSQL via Prisma ORM. MinIO for file storage. Docker Compose for local dev infrastructure. next-intl for i18n (RU + KZ).

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS 4, Prisma 6, PostgreSQL 16, MinIO, Docker Compose, next-intl, NextAuth.js

---

### Task 1: Initialize Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.js`

**Step 1: Create Next.js app**

Run:
```bash
cd /Users/serik/FlutterProject/qazqar/qazqar-site
npx create-next-app@15 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack
```

Expected: Next.js 15 project scaffolded in current directory.

**Step 2: Verify project runs**

Run:
```bash
npm run dev
```

Expected: Dev server starts on localhost:3000. Kill after verification.

**Step 3: Clean up default files**

Remove default Next.js content from `src/app/page.tsx`, `src/app/globals.css` (keep Tailwind directives only), delete `src/app/favicon.ico` placeholder content.

**Step 4: Commit**

```bash
git init
echo "node_modules/\n.next/\n.env\n.env.local\npostgres_data/\nminio_data/" > .gitignore
git add .
git commit -m "chore: initialize Next.js 15 project"
```

---

### Task 2: Docker Compose setup

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`
- Create: `.env`

**Step 1: Create docker-compose.yml**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: qazqar-postgres
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: qazqar
      POSTGRES_USER: qazqar
      POSTGRES_PASSWORD: qazqar_dev
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U qazqar"]
      interval: 5s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
    container_name: qazqar-minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 5s
      timeout: 5s
      retries: 5

  minio-init:
    image: minio/mc:latest
    container_name: qazqar-minio-init
    depends_on:
      minio:
        condition: service_healthy
    restart: "no"
    entrypoint: >
      /bin/sh -c "
      mc alias set local http://minio:9000 minioadmin minioadmin;
      mc mb local/qazqar-images --ignore-existing;
      mc anonymous set download local/qazqar-images;
      exit 0;
      "

volumes:
  postgres_data:
  minio_data:
```

**Step 2: Create .env.example and .env**

`.env.example`:
```env
# Database
DATABASE_URL="postgresql://qazqar:qazqar_dev@localhost:5432/qazqar"

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=qazqar-images
MINIO_USE_SSL=false

# Next Auth
NEXTAUTH_SECRET=change-me-in-production
NEXTAUTH_URL=http://localhost:3000

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MINIO_URL=http://localhost:9000/qazqar-images
```

Copy `.env.example` to `.env`.

**Step 3: Start Docker services and verify**

Run:
```bash
docker compose up -d
docker compose ps
```

Expected: postgres and minio running, minio-init completed successfully.

**Step 4: Verify MinIO console**

Open http://localhost:9001 — login minioadmin/minioadmin. Bucket `qazqar-images` should exist.

**Step 5: Commit**

```bash
git add docker-compose.yml .env.example .gitignore
git commit -m "infra: add Docker Compose with PostgreSQL and MinIO"
```

---

### Task 3: Prisma setup and schema

**Files:**
- Create: `prisma/schema.prisma`
- Modify: `package.json` (add prisma deps)
- Create: `src/lib/prisma.ts`

**Step 1: Install Prisma**

Run:
```bash
npm install prisma --save-dev
npm install @prisma/client
npx prisma init
```

**Step 2: Write Prisma schema**

`prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  CLIENT
  ADMIN
}

enum CarStatus {
  AVAILABLE
  RENTED
  MAINTENANCE
}

enum Transmission {
  AUTOMATIC
  MANUAL
}

enum FuelType {
  AI92
  AI95
  AI98
  DIESEL
}

enum BookingStatus {
  PENDING
  CONFIRMED
  ACTIVE
  COMPLETED
  CANCELLED
}

model User {
  id           String    @id @default(cuid())
  email        String?   @unique
  phone        String?   @unique
  passwordHash String
  firstName    String
  lastName     String
  role         UserRole  @default(CLIENT)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  bookings  Booking[]
  blogPosts BlogPost[]

  @@map("users")
}

model CarBrand {
  id   String @id @default(cuid())
  name String @unique
  slug String @unique
  logo String?

  models CarModel[]

  @@map("car_brands")
}

model CarModel {
  id      String   @id @default(cuid())
  name    String
  slug    String   @unique
  brandId String

  brand CarBrand @relation(fields: [brandId], references: [id])
  cars  Car[]

  @@map("car_models")
}

model Car {
  id            String       @id @default(cuid())
  modelId       String
  licensePlate  String       @unique
  year          Int
  color         String
  pricePerDay   Int
  transmission  Transmission @default(AUTOMATIC)
  fuelType      FuelType     @default(AI92)
  seats         Int          @default(5)
  hasAC         Boolean      @default(true)
  status        CarStatus    @default(AVAILABLE)
  images        String[]
  slug          String       @unique
  descriptionRu String?
  descriptionKz String?
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  model    CarModel  @relation(fields: [modelId], references: [id])
  bookings Booking[]

  @@map("cars")
}

model Booking {
  id              String        @id @default(cuid())
  userId          String?
  carId           String
  startDate       DateTime
  endDate         DateTime
  totalPrice      Int
  discountPercent Int           @default(0)
  status          BookingStatus @default(PENDING)
  customerName    String
  customerPhone   String
  comment         String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  user User? @relation(fields: [userId], references: [id])
  car  Car   @relation(fields: [carId], references: [id])

  @@map("bookings")
}

model BlogPost {
  id        String   @id @default(cuid())
  slug      String   @unique
  titleRu   String
  titleKz   String   @default("")
  contentRu String
  contentKz String   @default("")
  coverImage String?
  published Boolean  @default(false)
  authorId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  author User @relation(fields: [authorId], references: [id])

  @@map("blog_posts")
}

model Review {
  id         String   @id @default(cuid())
  authorName String
  rating     Int
  textRu     String
  textKz     String   @default("")
  approved   Boolean  @default(false)
  createdAt  DateTime @default(now())

  @@map("reviews")
}

model Discount {
  id      String  @id @default(cuid())
  minDays Int
  maxDays Int
  percent Int
  active  Boolean @default(true)

  @@map("discounts")
}

model FaqItem {
  id         String  @id @default(cuid())
  sortOrder  Int     @default(0)
  questionRu String
  questionKz String  @default("")
  answerRu   String
  answerKz   String  @default("")
  published  Boolean @default(true)

  @@map("faq_items")
}
```

**Step 3: Create Prisma client singleton**

`src/lib/prisma.ts`:
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**Step 4: Run first migration**

Run:
```bash
npx prisma migrate dev --name init
```

Expected: Migration created in `prisma/migrations/`, tables created in PostgreSQL.

**Step 5: Verify with Prisma Studio**

Run:
```bash
npx prisma studio
```

Expected: Opens browser at localhost:5555 with all tables visible.

**Step 6: Commit**

```bash
git add prisma/ src/lib/prisma.ts package.json package-lock.json
git commit -m "feat: add Prisma schema with all models and initial migration"
```

---

### Task 4: Seed data from current Qazqar site

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json` (add seed script)

**Step 1: Install ts-node for seed**

Run:
```bash
npm install --save-dev tsx
```

Add to `package.json`:
```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

**Step 2: Write seed file**

`prisma/seed.ts`:
```typescript
import { PrismaClient, UserRole, Transmission, FuelType, CarStatus } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Admin user
  const adminPassword = await hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@qazqar.kz" },
    update: {},
    create: {
      email: "admin@qazqar.kz",
      phone: "+77763504141",
      passwordHash: adminPassword,
      firstName: "Admin",
      lastName: "Qazqar",
      role: UserRole.ADMIN,
    },
  });

  // Car brands
  const hyundai = await prisma.carBrand.upsert({
    where: { slug: "hyundai" },
    update: {},
    create: { name: "Hyundai", slug: "hyundai" },
  });

  const kia = await prisma.carBrand.upsert({
    where: { slug: "kia" },
    update: {},
    create: { name: "KIA", slug: "kia" },
  });

  const toyota = await prisma.carBrand.upsert({
    where: { slug: "toyota" },
    update: {},
    create: { name: "Toyota", slug: "toyota" },
  });

  // Car models
  const accent = await prisma.carModel.upsert({
    where: { slug: "accent" },
    update: {},
    create: { name: "Accent", slug: "accent", brandId: hyundai.id },
  });

  const elantra = await prisma.carModel.upsert({
    where: { slug: "elantra" },
    update: {},
    create: { name: "Elantra", slug: "elantra", brandId: hyundai.id },
  });

  const sonata = await prisma.carModel.upsert({
    where: { slug: "sonata" },
    update: {},
    create: { name: "Sonata", slug: "sonata", brandId: hyundai.id },
  });

  const k5 = await prisma.carModel.upsert({
    where: { slug: "k5" },
    update: {},
    create: { name: "K5", slug: "k5", brandId: kia.id },
  });

  const camry = await prisma.carModel.upsert({
    where: { slug: "camry" },
    update: {},
    create: { name: "Camry", slug: "camry", brandId: toyota.id },
  });

  // Cars (from current qazqar.kz data)
  const carsData = [
    { modelId: k5.id, licensePlate: "K5-2021-W", year: 2021, color: "Белый", pricePerDay: 32000, fuelType: FuelType.AI95, slug: "kia-k5-2021-white" },
    { modelId: accent.id, licensePlate: "H465301", year: 2021, color: "Белый", pricePerDay: 16000, fuelType: FuelType.AI92, slug: "hyundai-accent-2019-white" },
    { modelId: sonata.id, licensePlate: "736BJ02", year: 2022, color: "Черный", pricePerDay: 35000, fuelType: FuelType.AI95, slug: "hyundai-sonata-2022-black" },
    { modelId: accent.id, licensePlate: "H482501", year: 2021, color: "Белый", pricePerDay: 16000, fuelType: FuelType.AI92, slug: "hyundai-accent-2021-white-2" },
    { modelId: elantra.id, licensePlate: "H460501", year: 2021, color: "Белый", pricePerDay: 20000, fuelType: FuelType.AI92, slug: "hyundai-elantra-2021-white" },
    { modelId: elantra.id, licensePlate: "H477601", year: 2021, color: "Белый", pricePerDay: 20000, fuelType: FuelType.AI92, slug: "hyundai-elantra-2021-white-2" },
    { modelId: camry.id, licensePlate: "638AFM01", year: 2016, color: "Белый", pricePerDay: 25000, fuelType: FuelType.AI95, slug: "toyota-camry-2016-white" },
    { modelId: accent.id, licensePlate: "H508401", year: 2021, color: "Белый", pricePerDay: 16000, fuelType: FuelType.AI92, slug: "hyundai-accent-2021-white-3" },
    { modelId: accent.id, licensePlate: "276CH01", year: 2017, color: "Белый", pricePerDay: 14000, fuelType: FuelType.AI92, slug: "hyundai-accent-2017-white" },
    { modelId: elantra.id, licensePlate: "598AJV01", year: 2023, color: "Белый", pricePerDay: 22000, fuelType: FuelType.AI92, slug: "hyundai-elantra-2023-white" },
    { modelId: accent.id, licensePlate: "678CR01", year: 2023, color: "Белый", pricePerDay: 18000, fuelType: FuelType.AI92, slug: "hyundai-accent-2023-white" },
    { modelId: accent.id, licensePlate: "348CI01", year: 2018, color: "Белый", pricePerDay: 14000, fuelType: FuelType.AI92, slug: "hyundai-accent-2018-white" },
    { modelId: accent.id, licensePlate: "546CQ01", year: 2023, color: "Белый", pricePerDay: 18000, fuelType: FuelType.AI92, slug: "hyundai-accent-2023-white-2" },
  ];

  for (const car of carsData) {
    await prisma.car.upsert({
      where: { slug: car.slug },
      update: {},
      create: {
        ...car,
        transmission: Transmission.AUTOMATIC,
        seats: 5,
        hasAC: true,
        status: CarStatus.AVAILABLE,
        images: [],
      },
    });
  }

  // Discounts (from current site)
  const discountsData = [
    { minDays: 3, maxDays: 5, percent: 10 },
    { minDays: 6, maxDays: 15, percent: 20 },
    { minDays: 16, maxDays: 30, percent: 30 },
    { minDays: 31, maxDays: 365, percent: 40 },
  ];

  await prisma.discount.deleteMany();
  for (const d of discountsData) {
    await prisma.discount.create({ data: { ...d, active: true } });
  }

  // FAQ items (from current site)
  const faqData = [
    { questionRu: "Возрастные ограничения", answerRu: "Возраст водителя от 21 года. Стаж вождения не менее 2 лет.", sortOrder: 1 },
    { questionRu: "Перечень необходимых документов", answerRu: "Для аренды автомобиля гражданину Казахстана понадобится паспорт и удостоверение водителя с правом управления транспортными средствами соответствующей категории.", sortOrder: 2 },
    { questionRu: "Способы оплаты", answerRu: "Для удобства клиентов мы предлагаем различные способы оплаты, в том числе и по безналичному расчету, переводом на Kaspi.", sortOrder: 3 },
    { questionRu: "Залог", answerRu: "Вместе с оплатой аренды клиент обязан внести депозит (залог) за автомобиль. Он может быть внесен наличными или переводом.", sortOrder: 4 },
    { questionRu: "Какое топливо использовать?", answerRu: "Компания настоятельно рекомендует производить заправку только на проверенных заправочных станциях топливом, указанным в характеристиках автомобиля.", sortOrder: 5 },
    { questionRu: "Требования по пробегу", answerRu: "Требование к пробегу в день 200 км, за каждые дополнительные 100 км — 1000 тг.", sortOrder: 6 },
    { questionRu: "Территория передвижения", answerRu: "Клиенты имеют право свободно использовать арендованные автомобили по городу Астана. Также возможен выезд за город по согласованию.", sortOrder: 7 },
    { questionRu: "Арендный срок", answerRu: "Минимальный срок аренды автомобиля составляет 24 часа.", sortOrder: 8 },
    { questionRu: "Условия страхования", answerRu: "Каждый автомобиль компании застрахован на условиях обязательного страхования.", sortOrder: 9 },
    { questionRu: "Получение и возвращение транспортного средства", answerRu: "Выдача и возврат автомобиля проводится в офисах в рабочее время. Также возможна доставка автомобиля.", sortOrder: 10 },
  ];

  await prisma.faqItem.deleteMany();
  for (const faq of faqData) {
    await prisma.faqItem.create({
      data: { ...faq, questionKz: "", answerKz: "", published: true },
    });
  }

  // Reviews (from current site)
  const reviewsData = [
    { authorName: "Алмас", rating: 5, textRu: "Отличный сервис! Машина была чистой и в отличном состоянии. Рекомендую!" },
    { authorName: "Дана", rating: 5, textRu: "Арендовала Hyundai Accent на неделю. Всё прошло отлично, цены приятные." },
    { authorName: "Ерлан", rating: 5, textRu: "Быстрое оформление, вежливый персонал. Буду обращаться снова." },
    { authorName: "Айгуль", rating: 4, textRu: "Хороший выбор автомобилей. Единственный минус — далековато расположен офис." },
  ];

  await prisma.review.deleteMany();
  for (const review of reviewsData) {
    await prisma.review.create({
      data: { ...review, textKz: "", approved: true },
    });
  }

  console.log("Seed completed successfully!");
  console.log(`- Admin user: admin@qazqar.kz / admin123`);
  console.log(`- ${carsData.length} cars`);
  console.log(`- ${discountsData.length} discounts`);
  console.log(`- ${faqData.length} FAQ items`);
  console.log(`- ${reviewsData.length} reviews`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Step 3: Install bcryptjs**

Run:
```bash
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

**Step 4: Run seed**

Run:
```bash
npx prisma db seed
```

Expected: Output showing all data seeded.

**Step 5: Verify in Prisma Studio**

Run: `npx prisma studio` — check all tables have data.

**Step 6: Commit**

```bash
git add prisma/seed.ts package.json package-lock.json
git commit -m "feat: add seed data from current Qazqar site"
```

---

### Task 5: MinIO client library

**Files:**
- Create: `src/lib/minio.ts`

**Step 1: Install MinIO SDK**

Run:
```bash
npm install minio
```

**Step 2: Create MinIO client**

`src/lib/minio.ts`:
```typescript
import { Client } from "minio";

export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: parseInt(process.env.MINIO_PORT || "9000"),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
  secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
});

export const BUCKET_NAME = process.env.MINIO_BUCKET || "qazqar-images";

export async function uploadFile(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  await minioClient.putObject(BUCKET_NAME, fileName, file, file.length, {
    "Content-Type": contentType,
  });
  return `${process.env.NEXT_PUBLIC_MINIO_URL}/${fileName}`;
}

export async function deleteFile(fileName: string): Promise<void> {
  await minioClient.removeObject(BUCKET_NAME, fileName);
}
```

**Step 3: Commit**

```bash
git add src/lib/minio.ts package.json package-lock.json
git commit -m "feat: add MinIO client for file uploads"
```

---

### Task 6: i18n setup (next-intl)

**Files:**
- Create: `src/i18n/config.ts`
- Create: `src/i18n/request.ts`
- Create: `src/i18n/messages/ru.json`
- Create: `src/i18n/messages/kz.json`
- Modify: `next.config.ts`
- Create: `src/middleware.ts`
- Modify: `src/app/layout.tsx` → `src/app/[locale]/layout.tsx`

**Step 1: Install next-intl**

Run:
```bash
npm install next-intl
```

**Step 2: Create i18n config**

`src/i18n/config.ts`:
```typescript
export const locales = ["ru", "kz"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ru";
```

`src/i18n/request.ts`:
```typescript
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
```

`src/i18n/routing.ts`:
```typescript
import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";
import { locales, defaultLocale } from "./config";

export const routing = defineRouting({
  locales,
  defaultLocale,
});

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
```

**Step 3: Create message files**

`src/i18n/messages/ru.json`:
```json
{
  "nav": {
    "home": "Главная",
    "about": "О нас",
    "catalog": "Каталог",
    "discounts": "Скидки",
    "reviews": "Отзывы",
    "terms": "Условия",
    "blog": "Блог",
    "login": "Войти",
    "cabinet": "Кабинет"
  },
  "hero": {
    "title": "Прокат автомобилей без водителей",
    "subtitle": "Широкий ассортимент автомобилей и самые доступные цены по всему городу Астана",
    "cta": "Каталог автомобилей"
  },
  "catalog": {
    "title": "Доступные автомобили",
    "subtitle": "Выберите лучший автомобиль",
    "description": "У нас есть автомобили разных классов. Выберите свой идеальный вариант и забронируйте его.",
    "rent": "Арендовать",
    "baseRate": "Базовая ставка",
    "perDay": "/ сутки",
    "filter": "Фильтр",
    "seats": "мест",
    "ac": "Кондиционер"
  },
  "steps": {
    "title": "Как арендовать",
    "subtitle": "Аренда автомобиля в два счета",
    "description": "Наша главная забота — обеспечить максимальное удобство и комфорт для Вас",
    "step1title": "Удобно",
    "step1desc": "Выберите и закажите автомобиль на сайте или позвоните нам",
    "step2title": "Быстро",
    "step2desc": "Присылаете нам удостоверение личности и водительские права. Подпишите договор за 1 минуту",
    "step3title": "Доступно",
    "step3desc": "Заберите автомобиль с офиса или доставка автомобиля в любую точку города"
  },
  "about": {
    "sectionTitle": "О нас",
    "title": "Выгодный прокат по всему городу",
    "description": "Наша компания более 3 лет оказывает услуги проката автомобилей без водителя в городе Астана."
  },
  "discounts": {
    "sectionTitle": "Выгодно — с нами",
    "title": "Чем больше срок аренды, тем выгоднее!",
    "days": "дней"
  },
  "reviews": {
    "sectionTitle": "Отзывы",
    "title": "Наши довольные клиенты"
  },
  "faq": {
    "sectionTitle": "FAQ",
    "title": "Условия аренды"
  },
  "footer": {
    "support": "Поддержка клиентов осуществляется круглосуточно",
    "hours": "Наш офис работает с понедельника по воскресенье — с 9:00 до 21:00",
    "rights": "Qazqar. Все права защищены",
    "tagline": "Аренда автомобилей без водителя в Астане"
  },
  "booking": {
    "title": "Оставить заявку",
    "name": "Ваше имя",
    "phone": "Телефон",
    "startDate": "Дата начала",
    "endDate": "Дата окончания",
    "comment": "Комментарий",
    "submit": "Отправить заявку",
    "success": "Заявка отправлена! Мы свяжемся с вами в ближайшее время."
  },
  "common": {
    "phone": "+7 776 350 41 41",
    "currency": "₸"
  }
}
```

`src/i18n/messages/kz.json`: (copy with placeholder KZ translations — will be filled later in Stage 7)
```json
{
  "nav": {
    "home": "Басты бет",
    "about": "Біз туралы",
    "catalog": "Каталог",
    "discounts": "Жеңілдіктер",
    "reviews": "Пікірлер",
    "terms": "Шарттар",
    "blog": "Блог",
    "login": "Кіру",
    "cabinet": "Кабинет"
  },
  "hero": {
    "title": "Жүргізушісіз автокөлік жалға беру",
    "subtitle": "Астана қаласы бойынша автокөліктердің кең ассортименті және қолжетімді бағалар",
    "cta": "Автокөліктер каталогы"
  },
  "catalog": {
    "title": "Қолжетімді автокөліктер",
    "subtitle": "Ең жақсы автокөлікті таңдаңыз",
    "description": "Бізде әртүрлі класстағы автокөліктер бар. Өзіңізге лайықты нұсқаны таңдап, брондаңыз.",
    "rent": "Жалға алу",
    "baseRate": "Базалық мөлшерлеме",
    "perDay": "/ тәулік",
    "filter": "Сүзгі",
    "seats": "орын",
    "ac": "Кондиционер"
  },
  "steps": {
    "title": "Қалай жалға алуға болады",
    "subtitle": "Автокөлікті жалға алу оңай",
    "description": "Біздің басты мақсатымыз — сіздің ыңғайлылығыңыз бен жайлылығыңызды қамтамасыз ету",
    "step1title": "Ыңғайлы",
    "step1desc": "Сайттан автокөлікті таңдап, тапсырыс беріңіз немесе бізге қоңырау шалыңыз",
    "step2title": "Жылдам",
    "step2desc": "Жеке куәлік пен жүргізуші куәлігін жіберіңіз. Шартқа 1 минутта қол қойыңыз",
    "step3title": "Қолжетімді",
    "step3desc": "Автокөлікті кеңседен алыңыз немесе қалаңыздың кез келген нүктесіне жеткізу"
  },
  "about": {
    "sectionTitle": "Біз туралы",
    "title": "Қала бойынша тиімді прокат",
    "description": "Біздің компания Астана қаласында 3 жылдан астам уақыт бойы жүргізушісіз автокөлік прокаты қызметін көрсетеді."
  },
  "discounts": {
    "sectionTitle": "Бізбен тиімді",
    "title": "Жалға алу мерзімі неғұрлым ұзақ болса, соғұрлым тиімді!",
    "days": "күн"
  },
  "reviews": {
    "sectionTitle": "Пікірлер",
    "title": "Біздің қанағаттанған клиенттер"
  },
  "faq": {
    "sectionTitle": "FAQ",
    "title": "Жалға алу шарттары"
  },
  "footer": {
    "support": "Клиенттерге тәулік бойы қолдау көрсетіледі",
    "hours": "Біздің кеңсе дүйсенбіден жексенбіге дейін — 9:00-ден 21:00-ге дейін жұмыс істейді",
    "rights": "Qazqar. Барлық құқықтар қорғалған",
    "tagline": "Астанада жүргізушісіз автокөлік жалға беру"
  },
  "booking": {
    "title": "Өтінім қалдыру",
    "name": "Сіздің атыңыз",
    "phone": "Телефон",
    "startDate": "Басталу күні",
    "endDate": "Аяқталу күні",
    "comment": "Пікір",
    "submit": "Өтінім жіберу",
    "success": "Өтінім жіберілді! Жақын арада сізбен байланысамыз."
  },
  "common": {
    "phone": "+7 776 350 41 41",
    "currency": "₸"
  }
}
```

**Step 4: Configure middleware and next.config**

`src/middleware.ts`:
```typescript
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
```

Update `next.config.ts`:
```typescript
import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {};

export default withNextIntl(nextConfig);
```

**Step 5: Restructure app directory for [locale]**

Move `src/app/layout.tsx` → `src/app/[locale]/layout.tsx`, update to use `NextIntlClientProvider`.

`src/app/[locale]/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Qazqar | Прокат автомобилей без водителей в Астане",
  description:
    "Широкий ассортимент автомобилей и самые доступные цены по всему городу Астана. Аренда от 14 000 ₸/сутки.",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="antialiased">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

Move `src/app/globals.css` to remain at `src/app/globals.css` (imported from layout).

Create `src/app/[locale]/page.tsx`:
```tsx
import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("hero");
  return (
    <main>
      <h1>{t("title")}</h1>
      <p>{t("subtitle")}</p>
    </main>
  );
}
```

**Step 6: Verify i18n works**

Run: `npm run dev`
- Visit `localhost:3000/ru` — shows Russian text
- Visit `localhost:3000/kz` — shows Kazakh text
- Visit `localhost:3000` — redirects to `/ru`

**Step 7: Commit**

```bash
git add src/i18n/ src/middleware.ts src/app/ next.config.ts package.json package-lock.json
git commit -m "feat: add i18n setup with next-intl (RU + KZ)"
```

---

### Task 7: Base layout — Header and Footer

**Files:**
- Create: `src/components/layout/Header.tsx`
- Create: `src/components/layout/Footer.tsx`
- Create: `src/components/layout/LanguageSwitcher.tsx`
- Create: `src/components/layout/MobileMenu.tsx`
- Modify: `src/app/[locale]/layout.tsx`
- Add: Qazqar logo to `public/images/logo.svg`

**Step 1: Download logo from current site**

Save current Qazqar logo SVG to `public/images/logo.svg`.

**Step 2: Create Header component**

`src/components/layout/Header.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import LanguageSwitcher from "./LanguageSwitcher";
import MobileMenu from "./MobileMenu";

const navItems = [
  { key: "home", href: "/" },
  { key: "about", href: "/#about" },
  { key: "discounts", href: "/#discounts" },
  { key: "reviews", href: "/#reviews" },
  { key: "terms", href: "/#faq" },
  { key: "blog", href: "/blog" },
] as const;

export default function Header() {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/images/logo.svg"
              alt="Qazqar"
              width={140}
              height={40}
              priority
            />
          </Link>

          {/* Language + Phone */}
          <div className="hidden md:flex items-center gap-4">
            <LanguageSwitcher />
            <a
              href={`tel:${tCommon("phone").replace(/\s/g, "")}`}
              className="text-sm font-medium text-cyan-500 hover:text-cyan-600 transition-colors"
            >
              {tCommon("phone")}
            </a>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="text-sm font-medium text-gray-700 hover:text-cyan-500 transition-colors"
              >
                {t(item.key)}
              </Link>
            ))}
            <Link
              href="/catalog"
              className="px-5 py-2 bg-cyan-500 text-white text-sm font-semibold rounded-lg hover:bg-cyan-600 transition-colors"
            >
              {t("catalog")}
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-gray-700"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}
```

**Step 3: Create LanguageSwitcher**

`src/components/layout/LanguageSwitcher.tsx`:
```tsx
"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { locales } from "@/i18n/config";

const labels: Record<string, string> = {
  ru: "RU",
  kz: "KZ",
};

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function switchLocale(newLocale: string) {
    router.replace(pathname, { locale: newLocale });
  }

  return (
    <div className="flex items-center gap-1">
      {locales.map((loc) => (
        <button
          key={loc}
          onClick={() => switchLocale(loc)}
          className={`px-2 py-1 text-xs font-semibold rounded transition-colors ${
            locale === loc
              ? "bg-cyan-500 text-white"
              : "text-gray-500 hover:text-cyan-500"
          }`}
        >
          {labels[loc]}
        </button>
      ))}
    </div>
  );
}
```

**Step 4: Create MobileMenu**

`src/components/layout/MobileMenu.tsx`:
```tsx
"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import LanguageSwitcher from "./LanguageSwitcher";

const navItems = [
  { key: "home", href: "/" },
  { key: "catalog", href: "/catalog" },
  { key: "about", href: "/#about" },
  { key: "discounts", href: "/#discounts" },
  { key: "reviews", href: "/#reviews" },
  { key: "terms", href: "/#faq" },
  { key: "blog", href: "/blog" },
] as const;

export default function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");

  if (!open) return null;

  return (
    <div className="lg:hidden border-t border-gray-100 bg-white">
      <div className="px-4 py-4 space-y-3">
        {navItems.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            onClick={onClose}
            className="block text-base font-medium text-gray-700 hover:text-cyan-500"
          >
            {t(item.key)}
          </Link>
        ))}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
          <a
            href={`tel:${tCommon("phone").replace(/\s/g, "")}`}
            className="text-cyan-500 font-medium"
          >
            {tCommon("phone")}
          </a>
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}
```

**Step 5: Create Footer**

`src/components/layout/Footer.tsx`:
```tsx
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/routing";

export default function Footer() {
  const t = useTranslations("footer");
  const tCommon = useTranslations("common");
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo + description */}
          <div>
            <Image
              src="/images/logo.svg"
              alt="Qazqar"
              width={140}
              height={40}
              className="brightness-0 invert"
            />
            <p className="mt-4 text-sm text-gray-400">{t("support")}</p>
            <p className="mt-1 text-sm text-gray-400">{t("hours")}</p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Контакты
            </h3>
            <a
              href={`tel:${tCommon("phone").replace(/\s/g, "")}`}
              className="text-lg font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              {tCommon("phone")}
            </a>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Мы в соцсетях
            </h3>
            <div className="flex gap-3">
              <a href="https://api.whatsapp.com/send?phone=77763504141" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-green-400 transition-colors">
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
          © {year} {t("rights")} —{" "}
          <Link href="/" className="hover:text-cyan-400 transition-colors">
            {t("tagline")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
```

**Step 6: Update layout to include Header + Footer**

Update `src/app/[locale]/layout.tsx` to wrap children with Header and Footer.

**Step 7: Create WhatsApp floating button**

`src/components/layout/WhatsAppButton.tsx`:
```tsx
export default function WhatsAppButton() {
  return (
    <a
      href="https://api.whatsapp.com/send?phone=77763504141"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors hover:scale-110"
      aria-label="WhatsApp"
    >
      <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    </a>
  );
}
```

**Step 8: Verify full layout**

Run: `npm run dev` — Visit localhost:3000/ru
- Header with logo, nav, language switcher, phone
- Page content
- Footer
- WhatsApp floating button

**Step 9: Commit**

```bash
git add src/components/layout/ src/app/ public/images/
git commit -m "feat: add base layout with Header, Footer, WhatsApp button, language switcher"
```

---

## Summary

After completing all 7 tasks, the foundation is ready:
- ✅ Next.js 15 project with TypeScript + Tailwind
- ✅ Docker Compose (PostgreSQL + MinIO)
- ✅ Prisma schema with all models + migrations
- ✅ Seed data from current Qazqar site
- ✅ MinIO client for file uploads
- ✅ i18n (RU + KZ) with next-intl
- ✅ Base layout (Header + Footer + WhatsApp button)

**Next:** Stage 2 — Public site pages (Home, Catalog, Car detail, Blog, FAQ)
