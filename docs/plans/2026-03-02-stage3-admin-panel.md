# Qazqar Stage 3: Admin Panel — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build complete admin panel with authentication, car fleet CRUD with MinIO image upload, bookings management, and content management (blog, FAQ, reviews, discounts). Consolidates original Stages 3-5 into one.

**Architecture:** Custom JWT auth with httpOnly cookies. Admin layout with sidebar navigation. Server components for data display, client components for forms. API routes for all CRUD operations. MinIO for image storage.

**Tech Stack:** Next.js 15 App Router, Prisma 7, Tailwind CSS 4, next-intl, jose (JWT), bcryptjs, MinIO

---

### Task 1: Authentication System

**Files:**
- Install: `jose` package (JWT library for Edge runtime)
- Create: `src/lib/auth.ts`
- Create: `src/app/[locale]/(auth)/login/page.tsx`
- Create: `src/components/auth/LoginForm.tsx`
- Create: `src/app/api/auth/login/route.ts`
- Create: `src/app/api/auth/logout/route.ts`
- Create: `src/app/api/auth/me/route.ts`
- Modify: `src/middleware.ts`

**`src/lib/auth.ts`** — JWT utilities:
```typescript
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "qazqar-secret-key-change-in-production");

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAdmin(): Promise<JWTPayload> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return session;
}
```

**Login API** — validates credentials, sets httpOnly cookie:
- POST /api/auth/login — { email, password } → set cookie + return user
- POST /api/auth/logout — clear cookie
- GET /api/auth/me — return current user from token

**Login page** — simple form with email/password, redirects to /admin on success.

**Middleware update** — add admin route protection:
- Check for auth-token cookie on /admin/* routes
- Verify JWT and check role === ADMIN
- Redirect to /login if unauthorized
- Keep existing i18n middleware

**Verify:** Login with admin@qazqar.kz / admin123 → redirected to /admin. Unauthenticated access to /admin → redirect to /login.

---

### Task 2: Admin Layout & Dashboard

**Files:**
- Create: `src/app/[locale]/admin/layout.tsx`
- Create: `src/app/[locale]/admin/page.tsx`
- Create: `src/components/admin/AdminSidebar.tsx`
- Create: `src/components/admin/AdminHeader.tsx`

**Admin layout** — separate from public layout:
- NO public Header/Footer (admin has its own)
- Left sidebar with navigation links
- Top header with user info and logout button
- Main content area

**AdminSidebar.tsx (client component):**
- Logo "Qazqar Admin"
- Nav links: Дашборд, Автомобили, Марки/Модели, Заявки, Блог, FAQ, Отзывы, Скидки
- Active link highlight (cyan-500)
- Collapsible on mobile

**AdminHeader.tsx (client component):**
- Breadcrumb or page title
- User name display
- Logout button (calls /api/auth/logout)

**Dashboard page (server component):**
- Stats cards: Total cars, Available cars, Pending bookings, Total bookings, Blog posts, Reviews
- Simple grid of stat cards fetched from Prisma counts
- Quick links to main admin sections

**Verify:** /ru/admin shows dashboard with sidebar, stats render from DB.

---

### Task 3: Cars CRUD + Image Upload

**Files:**
- Create: `src/app/[locale]/admin/cars/page.tsx`
- Create: `src/app/[locale]/admin/cars/new/page.tsx`
- Create: `src/app/[locale]/admin/cars/[id]/edit/page.tsx`
- Create: `src/components/admin/cars/CarsList.tsx`
- Create: `src/components/admin/cars/CarForm.tsx`
- Create: `src/components/admin/cars/ImageUpload.tsx`
- Create: `src/app/api/admin/cars/route.ts`
- Create: `src/app/api/admin/cars/[id]/route.ts`
- Create: `src/app/api/admin/upload/route.ts`

**Cars list page:**
- Table with columns: Image, Name, Year, Price, Status, Transmission, Actions
- Status badge (green=AVAILABLE, yellow=RENTED, red=MAINTENANCE)
- Edit/Delete action buttons
- "Добавить автомобиль" button
- Search by name (optional)

**Car form (client component):**
- Fields: Model (dropdown from models), License plate, Year, Color, Price per day, Transmission, Fuel type, Seats, AC checkbox, Status, Description RU, Description KZ
- Image upload section (drag & drop or file picker)
- Multiple images support
- Form validation
- Submit creates/updates car via API

**Image upload:**
- Component accepts files, previews them
- Uploads to /api/admin/upload which saves to MinIO
- Returns URL that gets stored in car.images array

**API routes:**
- GET /api/admin/cars — list all cars
- POST /api/admin/cars — create car
- GET /api/admin/cars/[id] — get car
- PUT /api/admin/cars/[id] — update car
- DELETE /api/admin/cars/[id] — delete car (or soft delete by status)
- POST /api/admin/upload — upload image to MinIO, return URL

All admin API routes check auth with requireAdmin().

**Verify:** Create a car, upload image, see it in list, edit it, see image renders on public catalog.

---

### Task 4: Brands & Models Management

**Files:**
- Create: `src/app/[locale]/admin/brands/page.tsx`
- Create: `src/components/admin/brands/BrandsList.tsx`
- Create: `src/components/admin/brands/BrandForm.tsx`
- Create: `src/components/admin/brands/ModelForm.tsx`
- Create: `src/app/api/admin/brands/route.ts`
- Create: `src/app/api/admin/brands/[id]/route.ts`
- Create: `src/app/api/admin/models/route.ts`
- Create: `src/app/api/admin/models/[id]/route.ts`

**Brands page:**
- List of brands with their models as expandable sections
- Inline add/edit brand (name, slug, logo)
- Add model to brand (name, slug)
- Delete brand/model (with cascade check — warn if cars exist)

**API routes:**
- CRUD for brands: GET, POST, PUT, DELETE /api/admin/brands
- CRUD for models: GET, POST, PUT, DELETE /api/admin/models

**Verify:** Add brand, add model under brand, use that model when creating a car.

---

### Task 5: Bookings Management

**Files:**
- Create: `src/app/[locale]/admin/bookings/page.tsx`
- Create: `src/app/[locale]/admin/bookings/[id]/page.tsx`
- Create: `src/components/admin/bookings/BookingsList.tsx`
- Create: `src/components/admin/bookings/BookingDetail.tsx`
- Create: `src/app/api/admin/bookings/route.ts`
- Create: `src/app/api/admin/bookings/[id]/route.ts`

**Bookings list:**
- Table: Client name, Phone, Car, Dates, Total, Status, Created, Actions
- Filter by status (tabs: All, Pending, Confirmed, Active, Completed, Cancelled)
- Status badge colors
- Click to view detail

**Booking detail page:**
- Full booking info
- Car info (link to car)
- Status update buttons: Pending → Confirm / Cancel, Confirmed → Activate, Active → Complete
- Timeline/history of status changes

**API routes:**
- GET /api/admin/bookings — list with status filter
- GET /api/admin/bookings/[id] — detail
- PATCH /api/admin/bookings/[id] — update status

**Verify:** See bookings in list, change status from PENDING → CONFIRMED.

---

### Task 6: Content Management (Blog, FAQ, Reviews, Discounts)

**Files:**
- Create: `src/app/[locale]/admin/blog/page.tsx`
- Create: `src/app/[locale]/admin/blog/new/page.tsx`
- Create: `src/app/[locale]/admin/blog/[id]/edit/page.tsx`
- Create: `src/components/admin/blog/BlogForm.tsx`
- Create: `src/app/api/admin/blog/route.ts`
- Create: `src/app/api/admin/blog/[id]/route.ts`
- Create: `src/app/[locale]/admin/faq/page.tsx`
- Create: `src/components/admin/faq/FaqForm.tsx`
- Create: `src/app/api/admin/faq/route.ts`
- Create: `src/app/api/admin/faq/[id]/route.ts`
- Create: `src/app/[locale]/admin/reviews/page.tsx`
- Create: `src/app/api/admin/reviews/route.ts`
- Create: `src/app/api/admin/reviews/[id]/route.ts`
- Create: `src/app/[locale]/admin/discounts/page.tsx`
- Create: `src/components/admin/discounts/DiscountForm.tsx`
- Create: `src/app/api/admin/discounts/route.ts`
- Create: `src/app/api/admin/discounts/[id]/route.ts`

**Blog management:**
- List with published/draft status
- Create/edit form: title RU, title KZ, content RU (textarea), content KZ, cover image upload, published toggle
- Preview link

**FAQ management:**
- List with sortOrder, drag-or-number reorder
- Inline create/edit: question RU/KZ, answer RU/KZ, published toggle, sort order

**Reviews management:**
- List of all reviews
- Approve/reject toggle
- Delete option
- No create — reviews come from customers

**Discounts management:**
- List of discount tiers
- Create/edit: minDays, maxDays, percent, active toggle
- Simple table with inline editing

**Verify:** Create blog post → see on /blog. Approve review → see on homepage. Change discount → see on homepage.

---

## Summary

After completing all 6 tasks:
- ✅ JWT authentication with admin role checking
- ✅ Admin layout with sidebar navigation
- ✅ Dashboard with statistics
- ✅ Full CRUD for cars with MinIO image upload
- ✅ Brands & models management
- ✅ Bookings management with status workflow
- ✅ Blog, FAQ, Reviews, Discounts management
- ✅ All admin API routes protected with auth

**Next:** Stage 6 — Personal client cabinet (registration, login, booking history)
