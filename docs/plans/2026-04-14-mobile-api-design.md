# Mobile API — дизайн доработок бэкенда

**Дата:** 2026-04-14
**Цель:** Подготовить API qazqar-site для подключения мобильного Flutter-приложения

---

## 1. Auth — токены в теле ответа

**Файлы:**
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/register/route.ts`
- `src/app/api/auth/refresh/route.ts`
- `src/lib/auth.ts` — `getSession()` fallback на Bearer header

**Изменение:** login/register/refresh возвращают `accessToken` и `refreshToken` в JSON-теле. Cookies продолжают ставиться (веб не ломается).

**Формат ответа:**
```json
{
  "user": { "id", "email", "firstName", "lastName", "role" },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

**getSession():** если cookie нет, проверить заголовок `Authorization: Bearer ...`.

---

## 2. Расчёт стоимости аренды

**Новый файл:** `src/app/api/catalog/[id]/price/route.ts`

**Эндпоинт:** `GET /api/catalog/[id]/price?dateStart=...&dateEnd=...`

**Логика:**
1. Найти авто по id → pricePerDay
2. Посчитать дни: ceil((dateEnd - dateStart) / day)
3. Проверить доступность (нет пересечений с PENDING/CONFIRMED/ACTIVE бронированиями)
4. Применить активные скидки (модель Discount)
5. Вернуть расчёт

**Ответ:**
```json
{
  "carId": "abc123",
  "pricePerDay": 15000,
  "days": 5,
  "subtotal": 75000,
  "discountPercent": 10,
  "discountAmount": 7500,
  "totalPrice": 67500,
  "available": true
}
```

**Если недоступно:** `{ "available": false, "error": "CAR_UNAVAILABLE" }`

**Валидация:** dateStart < dateEnd, обе даты в будущем, авто существует и AVAILABLE.

---

## 3. Список адресов

**Модель Prisma:**
```prisma
model Address {
  id        String   @id @default(cuid())
  name      String
  address   String
  lat       Float?
  lng       Float?
  isActive  Boolean  @default(true)
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("addresses")
}
```

**Публичный:** `GET /api/addresses` — только активные, сортировка по sortOrder.

**Админские:** `src/app/api/admin/addresses/` — стандартный CRUD, защищён `requireAdmin()`.

---

## 4. Закрытие заказа с фото

**Новый файл:** `src/app/api/cabinet/bookings/[id]/close/route.ts`

**Эндпоинт:** `POST /api/cabinet/bookings/[id]/close`
**Content-Type:** `multipart/form-data`

**Поля:** `photos[]` (1-10 файлов, макс 10MB, image/*), `comment` (опционально)

**Логика:**
1. Проверить сессию (cookie или Bearer)
2. Найти бронирование, проверить userId
3. Статус должен быть ACTIVE
4. Загрузить фото в MinIO: `bookings/{bookingId}/{filename}`
5. Обновить: status → COMPLETED, documents → ссылки на фото
6. Синхронизировать с Yume CRM если есть requestId

**Ответ:**
```json
{
  "success": true,
  "booking": {
    "id": "abc",
    "status": "COMPLETED",
    "documents": ["bookings/abc/photo1.jpg", "bookings/abc/photo2.jpg"]
  }
}
```
