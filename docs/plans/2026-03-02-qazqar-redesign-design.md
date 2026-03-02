# Qazqar.kz — Редизайн и пересоздание сайта

## Контекст

Qazqar — сервис проката автомобилей без водителей в Астане, Казахстан.

Текущее состояние: 3 разрозненных системы:
- Публичный сайт (qazqar.kz) — лендинг
- CVM Pipicar (cvm10.a7.kz) — управление автопарком (внешний SaaS)
- CMS (qazqar.kz/login) — управление контентом

Задача: объединить всё в одну собственную платформу с редизайном.

## Стек технологий

| Компонент | Технология |
|-----------|-----------|
| Frontend + Backend | Next.js 14+ (App Router) |
| Стилизация | Tailwind CSS |
| ORM | Prisma |
| БД | PostgreSQL 16 |
| Auth | NextAuth.js |
| i18n | next-intl (RU + KZ) |
| Файлы/фото | MinIO (S3-compatible) |
| Миграции | Prisma Migrate (аналог Flyway) |
| Локальная среда | Docker Compose (PostgreSQL + MinIO) |

## Структура проекта

```
qazqar-site/
├── docker-compose.yml
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── [locale]/              # i18n: /ru/..., /kz/...
│   │   │   ├── (public)/          # Публичный сайт
│   │   │   │   ├── page.tsx       # Главная
│   │   │   │   ├── catalog/       # Каталог авто
│   │   │   │   │   └── [slug]/    # Страница авто
│   │   │   │   ├── about/
│   │   │   │   ├── blog/
│   │   │   │   │   └── [slug]/
│   │   │   │   ├── faq/
│   │   │   │   └── terms/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── cabinet/
│   │   │   │   ├── bookings/
│   │   │   │   └── profile/
│   │   │   └── admin/
│   │   │       ├── page.tsx       # Дашборд
│   │   │       ├── cars/
│   │   │       ├── bookings/
│   │   │       ├── blog/
│   │   │       ├── reviews/
│   │   │       ├── faq/
│   │   │       ├── discounts/
│   │   │       └── users/
│   │   └── api/
│   │       ├── auth/
│   │       ├── cars/
│   │       ├── bookings/
│   │       ├── blog/
│   │       ├── reviews/
│   │       └── upload/
│   ├── components/
│   │   ├── ui/                    # Базовые UI-компоненты
│   │   ├── layout/                # Header, Footer, Sidebar
│   │   ├── catalog/               # Карточки авто, фильтры
│   │   ├── booking/               # Формы бронирования
│   │   └── admin/                 # Компоненты админки
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── minio.ts
│   │   └── auth.ts
│   └── i18n/
│       ├── messages/
│       │   ├── ru.json
│       │   └── kz.json
│       └── config.ts
├── public/
│   └── images/
└── .env.example
```

## Модели данных (Prisma)

### User
- id, email, phone, passwordHash
- firstName, lastName
- role: CLIENT | ADMIN
- documents (JSON)
- createdAt, updatedAt

### CarBrand
- id, name, slug, logo

### CarModel
- id, brandId -> CarBrand
- name, slug

### Car
- id, modelId -> CarModel
- licensePlate (госномер)
- year, color
- pricePerDay (тг)
- transmission: AUTOMATIC | MANUAL
- fuelType: AI92 | AI95 | AI98 | DIESEL
- seats (мест)
- hasAC (кондиционер)
- status: AVAILABLE | RENTED | MAINTENANCE
- images[] (пути в MinIO)
- slug (для URL)
- descriptionRu, descriptionKz
- createdAt, updatedAt

### Booking
- id, userId -> User, carId -> Car
- startDate, endDate
- totalPrice, discountPercent
- status: PENDING | CONFIRMED | ACTIVE | COMPLETED | CANCELLED
- customerName, customerPhone (для незарег. клиентов)
- comment
- createdAt, updatedAt

### BlogPost
- id, slug
- titleRu, titleKz
- contentRu, contentKz
- coverImage (MinIO)
- published: boolean
- authorId -> User
- createdAt, updatedAt

### Review
- id
- authorName, rating (1-5)
- textRu, textKz
- approved: boolean
- createdAt

### Discount
- id, minDays, maxDays, percent
- active: boolean

### FaqItem
- id, sortOrder
- questionRu, questionKz
- answerRu, answerKz
- published: boolean

## Docker Compose (локальная разработка)

PostgreSQL 16 + MinIO с автосозданием bucket `qazqar-images`.

## Дизайн

Обновление текущего бренда:
- Основные цвета: голубой (#00BCD4 / cyan) + белый + тёмно-серый
- Логотип: сохраняем Qazqar
- Стиль: современный, чистый, с акцентами анимации
- Типографика: характерный шрифт для заголовков, чистый для текста
- Адаптив: mobile-first

## Этапы реализации

### Этап 1: Фундамент
- Next.js проект, Docker Compose, Prisma схема, миграции, seed
- Базовый layout (header, footer)

### Этап 2: Публичный сайт
- Главная страница (все секции)
- Каталог с фильтрами
- Страница авто с формой заявки
- Блог, FAQ, О нас

### Этап 3: Админ-панель
- Auth (admin)
- CRUD автопарка + загрузка фото в MinIO
- Управление марками/моделями

### Этап 4: Заявки
- Форма бронирования на сайте
- Управление заявками в админке
- Уведомления (email/WhatsApp опционально)

### Этап 5: Контент
- CRUD блога с редактором
- Управление FAQ, отзывами, скидками

### Этап 6: Личный кабинет
- Регистрация/вход клиентов
- Профиль, история бронирований

### Этап 7: i18n
- Казахский перевод UI
- Двуязычный контент

### Этап 8: Полировка
- SEO (sitemap, meta, JSON-LD)
- Оптимизация изображений (next/image + MinIO)
- Тестирование, адаптив
