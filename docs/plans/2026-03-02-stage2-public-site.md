# Qazqar Stage 2: Public Site — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build all public-facing pages: full landing page with all sections, catalog with filters, car detail page with booking form, blog, and static pages.

**Architecture:** Server components for data fetching (direct Prisma queries, no API layer needed for reads). Client components only where interactivity is needed (filters, forms, carousels). One API route for booking submission. All text from i18n translation files.

**Tech Stack:** Next.js 15 App Router, Prisma 7 (server-side), Tailwind CSS 4, next-intl, React Server Components

---

### Task 1: Data Access Layer

**Files:**
- Create: `src/lib/data/cars.ts`
- Create: `src/lib/data/content.ts`

Create server-side data fetching functions that will be reused across pages.

`src/lib/data/cars.ts`:
```typescript
import { prisma } from "@/lib/prisma";

export async function getCars(filters?: {
  brandSlug?: string;
  minPrice?: number;
  maxPrice?: number;
  transmission?: string;
}) {
  const where: any = { status: "AVAILABLE" };
  if (filters?.brandSlug) {
    where.model = { brand: { slug: filters.brandSlug } };
  }
  if (filters?.minPrice || filters?.maxPrice) {
    where.pricePerDay = {};
    if (filters.minPrice) where.pricePerDay.gte = filters.minPrice;
    if (filters.maxPrice) where.pricePerDay.lte = filters.maxPrice;
  }
  if (filters?.transmission) {
    where.transmission = filters.transmission;
  }

  return prisma.car.findMany({
    where,
    include: { model: { include: { brand: true } } },
    orderBy: { pricePerDay: "asc" },
  });
}

export async function getCarBySlug(slug: string) {
  return prisma.car.findUnique({
    where: { slug },
    include: { model: { include: { brand: true } } },
  });
}

export async function getBrands() {
  return prisma.carBrand.findMany({
    include: { models: true },
    orderBy: { name: "asc" },
  });
}

export async function getSimilarCars(carId: string, modelId: string, limit = 3) {
  return prisma.car.findMany({
    where: { modelId, id: { not: carId }, status: "AVAILABLE" },
    include: { model: { include: { brand: true } } },
    take: limit,
  });
}
```

`src/lib/data/content.ts`:
```typescript
import { prisma } from "@/lib/prisma";

export async function getDiscounts() {
  return prisma.discount.findMany({
    where: { active: true },
    orderBy: { minDays: "asc" },
  });
}

export async function getReviews() {
  return prisma.review.findMany({
    where: { approved: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getFaqItems() {
  return prisma.faqItem.findMany({
    where: { published: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getBlogPosts(page = 1, perPage = 9) {
  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: { author: { select: { firstName: true, lastName: true } } },
    }),
    prisma.blogPost.count({ where: { published: true } }),
  ]);
  return { posts, total, totalPages: Math.ceil(total / perPage) };
}

export async function getBlogPostBySlug(slug: string) {
  return prisma.blogPost.findUnique({
    where: { slug, published: true },
    include: { author: { select: { firstName: true, lastName: true } } },
  });
}
```

**Verify:** Import these in a test page or check that TypeScript compiles without errors: `npx tsc --noEmit`

---

### Task 2: Home Page — Full Landing

**Files:**
- Create: `src/components/home/HeroSection.tsx`
- Create: `src/components/home/CarsSection.tsx`
- Create: `src/components/home/StepsSection.tsx`
- Create: `src/components/home/AboutSection.tsx`
- Create: `src/components/home/DiscountsSection.tsx`
- Create: `src/components/home/ReviewsSection.tsx`
- Create: `src/components/home/FaqSection.tsx`
- Create: `src/components/ui/CarCard.tsx`
- Modify: `src/app/[locale]/page.tsx`

The home page is a server component that fetches data and passes it to section components.

**page.tsx structure:**
```tsx
import { getCars } from "@/lib/data/cars";
import { getDiscounts, getReviews, getFaqItems } from "@/lib/data/content";
// Import all section components
// Fetch data in parallel with Promise.all
// Render sections sequentially
```

**HeroSection.tsx:**
- Full-width hero with gradient/image background
- Title: "Прокат автомобилей без водителей" (from t("hero.title"))
- Subtitle text
- CTA button "Каталог автомобилей" linking to /catalog
- Brand color cyan-500 for CTA
- Consider a subtle car illustration or the current site's style with a car image on the right

**CarsSection.tsx:**
- Section title "Доступные автомобили" / "Выберите лучший автомобиль"
- Grid of CarCard components (3 columns on desktop, 1 on mobile)
- Show first 6 available cars
- "Смотреть все" link to /catalog at bottom

**CarCard.tsx (reusable):**
- Car image (placeholder if no images in DB — use a gray box with car icon)
- Title: "Brand Model - Year Color" (e.g., "KIA K5 - 2021 Белый")
- Icons row: AC, transmission type, seats count
- Price: "Базовая ставка: 32000 ₸"
- "Арендовать" CTA button linking to /catalog/[slug]
- Rounded corners, subtle shadow on hover

**StepsSection.tsx:**
- 3 cards in a row: "Удобно", "Быстро", "Доступно"
- Each with an icon (use simple SVG icons or emoji-based), title, description
- From translations: steps.step1title, steps.step1desc, etc.

**AboutSection.tsx:**
- Two-column layout: image on left, text on right
- Title, description from translations
- Can use a placeholder image

**DiscountsSection.tsx:**
- Colored background section (cyan-500 or dark)
- 4 cards showing: 10% (3-5 days), 20% (6-15), 30% (16-30), 40% (30+)
- Data comes from Prisma discounts table (passed as props)

**ReviewsSection.tsx:**
- Grid or carousel of review cards
- Each: author name, rating (stars), text
- Data from Prisma reviews (passed as props)

**FaqSection.tsx (client component):**
- Accordion with expand/collapse
- Question as header, answer as expandable content
- Use useState for open/close state
- Data from Prisma FAQ items (passed as props)

**Design guidelines (from current qazqar.kz):**
- Clean, modern layout
- Generous whitespace between sections
- Cyan-500 (#06b6d4) for primary accents and CTAs
- Section titles: large, bold, centered with small subtitle
- Alternating white/light-gray section backgrounds for visual separation

**Verify:**
- Visit localhost:3002/ru — full landing page with all sections
- All data from database renders correctly
- Responsive on mobile
- Language switch to /kz changes all text

---

### Task 3: Catalog Page with Filters

**Files:**
- Create: `src/app/[locale]/(public)/catalog/page.tsx`
- Create: `src/components/catalog/CatalogFilters.tsx`
- Create: `src/components/catalog/CatalogGrid.tsx`

**catalog/page.tsx (server component):**
- Reads searchParams for filters: ?brand=hyundai&minPrice=15000&maxPrice=30000&transmission=AUTOMATIC
- Fetches cars with filters using getCars()
- Fetches brands for filter dropdown using getBrands()
- Renders CatalogFilters + CatalogGrid

**CatalogFilters.tsx (client component):**
- Brand dropdown (from brands list)
- Price range (min/max inputs or preset ranges)
- Transmission toggle (all / АКПП / МКПП)
- Uses URL searchParams for filter state (router.push with updated params)
- "Сбросить" reset button

**CatalogGrid.tsx (server component):**
- Grid of CarCard components (3 cols desktop, 2 tablet, 1 mobile)
- Shows count: "Найдено: 13 автомобилей"
- Empty state: "Автомобилей по вашим критериям не найдено"

**Important:**
- Filters use URL searchParams (not client state) so they work with SSR and are shareable
- Reuse CarCard from Task 2
- Create (public) route group if not exists

**Verify:**
- Visit /ru/catalog — shows all cars in grid
- Filter by brand — grid updates
- Filter by price — grid filters correctly
- Reset clears all filters
- Direct URL with params works: /ru/catalog?brand=hyundai

---

### Task 4: Car Detail Page + Booking Form + API

**Files:**
- Create: `src/app/[locale]/(public)/catalog/[slug]/page.tsx`
- Create: `src/components/car/CarGallery.tsx`
- Create: `src/components/car/CarSpecs.tsx`
- Create: `src/components/car/BookingForm.tsx`
- Create: `src/components/car/SimilarCars.tsx`
- Create: `src/app/api/bookings/route.ts`

**catalog/[slug]/page.tsx (server component):**
- Fetches car by slug using getCarBySlug()
- If not found, call notFound()
- Fetches similar cars using getSimilarCars()
- Generates dynamic metadata (title, description, OpenGraph)
- Renders: CarGallery + CarSpecs + BookingForm + SimilarCars

**generateMetadata function:**
```tsx
export async function generateMetadata({ params }) {
  const car = await getCarBySlug(params.slug);
  if (!car) return {};
  const title = `${car.model.brand.name} ${car.model.name} ${car.year} — Аренда в Астане | Qazqar`;
  return { title, description: `Аренда ${car.model.brand.name} ${car.model.name} от ${car.pricePerDay} ₸/сутки...` };
}
```

**CarGallery.tsx:**
- If car has images array — show gallery with thumbnails
- If no images — show placeholder with car silhouette and brand/model text
- Use next/image for optimization

**CarSpecs.tsx:**
- Two-column specs list:
  - Марка / Модель / Год / Цвет
  - КПП (АКПП/МКПП) / Топливо / Мест / Кондиционер
- Price highlighted: "от 32 000 ₸ / сутки"
- Discount info: "Скидка до 40% при длительной аренде"

**BookingForm.tsx (client component):**
- Fields: Имя, Телефон, Дата начала, Дата окончания, Комментарий
- Hidden carId field
- Client-side calculation: days * pricePerDay - discount
- Shows total price with discount breakdown
- Submit via fetch to /api/bookings
- Success/error toast messages
- Form validation (required fields, dates in future, end > start)
- All labels from translations (booking.name, booking.phone, etc.)

**API route /api/bookings/route.ts:**
```typescript
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  // Validate required fields
  // Calculate total price with discount
  // Create booking with status PENDING
  // Return { success: true, bookingId }
}
```

Discount calculation logic:
- Calculate number of days between startDate and endDate
- Find applicable discount from DB
- totalPrice = days * car.pricePerDay * (1 - discount/100)

**SimilarCars.tsx:**
- Row of 3 CarCards with similar cars
- Title: "Похожие автомобили"

**Verify:**
- Visit /ru/catalog/kia-k5-2021-white — full car page
- Specs display correctly
- Booking form calculates price as dates change
- Form submits and shows success
- Check DB: new booking in bookings table with status PENDING
- 404 for non-existent slug

---

### Task 5: Blog Pages

**Files:**
- Create: `src/app/[locale]/(public)/blog/page.tsx`
- Create: `src/app/[locale]/(public)/blog/[slug]/page.tsx`
- Create: `src/components/blog/BlogCard.tsx`

**blog/page.tsx (server component):**
- Fetches published blog posts with getBlogPosts(page)
- Reads ?page=N from searchParams for pagination
- Grid of BlogCard components (3 cols)
- Simple pagination at bottom (Prev / Page N of M / Next)
- Empty state if no posts: "Пока нет статей"

**BlogCard.tsx:**
- Cover image (or placeholder)
- Title (from titleRu or titleKz based on locale)
- Date formatted nicely
- Author name
- "Читать далее" link to /blog/[slug]

**blog/[slug]/page.tsx (server component):**
- Fetches post by slug with getBlogPostBySlug()
- Renders: cover image, title, date, author, content
- Content rendered as HTML (from contentRu/contentKz)
- Back link to /blog
- generateMetadata for SEO

**Note on locale-aware content:**
- Use the current locale to pick titleRu vs titleKz, contentRu vs contentKz
- Create a helper: `function localized(obj, field, locale) { return obj[field + locale.charAt(0).toUpperCase() + locale.slice(1)] || obj[field + 'Ru']; }`
- Or simpler: just use `locale === 'kz' ? post.titleKz || post.titleRu : post.titleRu`

**Verify:**
- Visit /ru/blog — shows blog listing (may be empty if no seed posts, that's OK)
- Pagination works if posts exist
- Empty state displays correctly

---

### Task 6: Static Pages (About, FAQ, Terms)

**Files:**
- Create: `src/app/[locale]/(public)/about/page.tsx`
- Create: `src/app/[locale]/(public)/faq/page.tsx`
- Create: `src/app/[locale]/(public)/terms/page.tsx`

**about/page.tsx:**
- Company story section (from translations)
- Mission statement
- Can reuse AboutSection from home page or create a fuller version
- Contact info, office address, map placeholder

**faq/page.tsx (server component):**
- Fetches FAQ items from DB
- Full-page FAQ accordion (reuse FaqSection component from home page)
- Longer version with all questions
- SEO metadata

**terms/page.tsx:**
- Static rental terms content (from translations or hardcoded)
- Clean typography for reading
- Sections: Age requirements, Documents, Payment, Deposit, Fuel, Mileage, Territory, Insurance, Vehicle return
- Same content as current qazqar.kz conditions section but as a dedicated page

**Verify:**
- /ru/about — about page renders
- /ru/faq — FAQ with all questions, accordion works
- /ru/terms — rental terms readable
- All pages responsive, header/footer present

---

## Summary

After completing all 6 tasks:
- ✅ Full landing page with all sections (Hero, Cars, Steps, About, Discounts, Reviews, FAQ)
- ✅ Catalog page with brand/price/transmission filters
- ✅ Car detail page with gallery, specs, price calculator, booking form
- ✅ Booking API (creates PENDING bookings)
- ✅ Blog pages with pagination
- ✅ Dedicated About, FAQ, Terms pages
- ✅ All pages bilingual (RU + KZ)
- ✅ All pages responsive

**Next:** Stage 3 — Admin panel
