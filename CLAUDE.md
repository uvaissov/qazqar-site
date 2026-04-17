# QazQar Site

Платформа аренды автомобилей без водителя в Астане, Казахстан.

## Стек

- **Next.js 15** (App Router, Turbopack) + **React 19**
- **Tailwind CSS 4**, Lucide icons
- **Prisma 7** + PostgreSQL
- **next-intl** — мультиязычность (ru/kz)
- **MinIO** — хранилище изображений
- **jose** — JWT-аутентификация

## Структура

```
src/
├── app/[locale]/          # Страницы с локализацией
│   ├── (auth)/            # login, register
│   ├── (public)/          # catalog, blog, about, faq, terms
│   ├── admin/             # Админ-панель (cars, bookings, blog, brands, users, discounts, reviews, faq)
│   ├── cabinet/           # Личный кабинет пользователя
│   └── api/               # REST API (auth, bookings, admin/*, cabinet/*)
├── components/            # Компоненты по фичам (admin, auth, cabinet, car, catalog, home, layout, ui)
├── generated/prisma/      # Автогенерация Prisma
├── i18n/                  # Конфиг локализации и переводы
├── lib/                   # prisma.ts, auth.ts, minio.ts, utils.ts, data/
└── middleware.ts          # Auth + locale routing
```

## Модели данных

- **User** — роли CLIENT/ADMIN
- **CarBrand** → **CarModel** → **Car** — каталог авто (статусы: AVAILABLE/RENTED/MAINTENANCE)
- **Booking** — заявки на аренду (PENDING → CONFIRMED → ACTIVE → COMPLETED/CANCELLED)
- **BlogPost**, **Review**, **Discount**, **FaqItem** — контент

## Интеграция с Yume Cloud CRM API

Сайт выступает BFF (Backend For Frontend) — прокси-слой между мобильным приложением и Yume Cloud CRM API. Локальная БД используется как кэш для быстрой отдачи данных и защиты CRM API от большого потока запросов.

```
Flutter App  →  qazqar-site (Next.js API)  →  Yume Cloud CRM API
                     ↑
               PostgreSQL (кэш)
```

### Базовые настройки

- **Base URL**: `https://api.yume.cloud`
- **Origin**: `https://qazqar.yume.cloud`
- **Авторизация**: `POST /v1/auth/login/` → JWT Bearer token

### Эндпоинты (точные пути из docs/qazqar.py)

| Действие | Метод | Путь | Swagger |
|----------|-------|------|---------|
| Авторизация | POST | `/v1/auth/login/` | — |
| Поиск клиента | GET | `/v1/crm/clients/?phone__exact={phone}` | [clients](https://api.yume.cloud/crm/main/docs/swagger/#/clients/clients_create) |
| Создание клиента | POST | `/v1/crm/clients/` | [clients_create](https://api.yume.cloud/crm/main/docs/swagger/#/clients/clients_create) |
| Обновление клиента | PATCH | `/v1/crm/clients/{id}/` | — |
| Поиск авто | GET | `/v1/crm/inventories/?search={query}` | [inventories_list](https://api.yume.cloud/crm/main/docs/swagger/#/inventories/inventories_list) |
| Гараж (активные авто) | GET | `/v1/crm/inventories/?disabled=false&free=false&has_sublease=false&mode=inventory` | — |
| Добавление авто | POST | `/v1/crm/inventories/` | [inventories_create](https://api.yume.cloud/crm/main/docs/swagger/#/inventories/inventories_create) |
| Создание заявки | POST | `/v1/crm/requests/` | [orders_create](https://api.yume.cloud/crm/orders/docs/swagger/#/default/root_create) |
| Привязка авто к заявке | POST | `/v1/crm/requests/{id}/inventories/bulk_create/` | — |
| Сохранение заявки | PATCH | `/v1/crm/requests/{id}/` | — |
| Генерация документа | POST | `/v2/documents/` | [document_create](https://api.yume.cloud/crm/document/docs/swagger/#/default/root_create) |
| Расписание авто | GET | `/v1/crm/inventories/schedules/?start_at=YYYY-MM-DD&end_at=YYYY-MM-DD&disabled=false` | — |

### Расписание авто (schedules)

Главный эндпоинт для определения занятости авто. Возвращает список авто с массивом `schedules[]` — бронирования за период.

Параметры: `page`, `pageSize`, `search`, `start_at`, `end_at`, `disabled`, `skip_loader`

Поля в `schedules[]`:
- `start_at` / `end_at` — период бронирования
- `fact_start_at` / `fact_end_at` — фактические даты
- `request_id` — ID заявки
- `request_status_color` — статус: `"reserve"` (активная бронь), `"completed"` (завершена)
- `client` — данные клиента (id, name, phone, email)
- `rent_price` — полная стоимость
- `rent_price_inventory` — стоимость авто
- `rent_price_service` — стоимость услуг

### Архитектура синхронизации

**Авто** — polling каждую минуту (inventories + schedules → локальная БД). Сопоставление по `licensePlate` ↔ `car.number`.

**Клиенты и заявки** — on-demand, синхронизируются по факту запроса пользователя.

### Flow аренды (из docs/qazqar.py)

1. **Авторизация** → получить JWT-токен
2. **Поиск/создание клиента** по телефону (`phone__exact`)
3. **Поиск авто** — `GET /v1/crm/inventories/?search=` (ищет по названию, техпаспорту, номеру)
4. **Создание заявки** — `POST /v1/crm/requests/` с `{client, rent_start, rent_end}`
5. **Привязка авто** — `POST /v1/crm/requests/{id}/inventories/bulk_create/` с `{inventory, tarif_price, tarif_duration: 86400, start_at, end_at}`
6. **Сохранение** — `PATCH /v1/crm/requests/{id}/`
7. **Генерация документа** — `POST /v2/documents/` с `{object_id, content_type: "orderrequest", template}`

### Шаблоны документов

| ID | Название |
|----|----------|
| 160 | Договор аренды |
| 161 | Акт приема передачи |
| 162 | Путевой лист |

## Поиск клиента в CRM (важно)

Для **любого** поиска клиента в Yume CRM (регистрация, привязка из админки, синхронизация) используй `yumeApi.searchClients(query)` — это fulltext-поиск (`/v1/crm/clients/?search=`), который ищет по имени, телефону, email, ИИН.

**НЕ используй** `findClientByPhone()` / `findClientByEmail()` / `findClientByIin()` для основного поиска — они дёргают `*__exact`-фильтры, и из-за разницы в форматах телефона (`+77001234567` vs `77001234567` vs `8700...`) или регистре email — часто промахиваются. Эти методы оставлены только для специфичных случаев точного совпадения.

**Канонический паттерн** (см. `/api/admin/users/[id]/link-crm` GET и `/api/auth/register`):

```typescript
const candidates = new Map<number, YumeClient>();
if (email) for (const c of await yumeApi.searchClients(email)) candidates.set(c.id, c);
if (phone) for (const c of await yumeApi.searchClients(phone)) candidates.set(c.id, c);
if (iin)   for (const c of await yumeApi.searchClients(iin))   candidates.set(c.id, c);
```

Дедупликация по `id` через Map. Если ничего не нашлось — создаём через `createClient()`.

## Регистрация клиента — поток

`POST /api/auth/register` принимает `{ firstName, lastName, email, phone, iin, isResident, password, otpCode }`.

Шаги:
1. Валидация ИИН формата + контрольной суммы (`src/lib/iin.ts`, `validateIin()`).
2. Поиск/создание CRM-клиента по схеме выше → `crmClientId`.
3. Проверка OTP (`verifyOtp(email, code, "REGISTER")`).
4. Проверка дубликата email (`prisma.user.findUnique({ where: { email }})` → 409 `EMAIL_EXISTS`).
5. Создание юзера с `clientId: crmClientId`, выдача JWT cookies.

**Важно:** поля `User.iin` и `User.clientId` **НЕ уникальные** — несколько локальных аккаунтов могут указывать на одного CRM-клиента или иметь одинаковый ИИН. Не возвращай `IIN_EXISTS` / unique-constraint ошибки на этих полях.

Шаги OTP-флоу с фронта (используется на сайте `RegisterForm` и в Flutter `sign_up`):
1. `POST /api/auth/send-otp` `{email, type: "REGISTER"}` → 409 если email уже занят.
2. `POST /api/auth/verify-otp` `{email, code, type: "REGISTER"}` → `{verified: true}`.
3. `POST /api/auth/register` с `otpCode` + всеми полями → выдаёт JWT.

## Команды

```bash
npm run dev      # Запуск dev-сервера (Turbopack)
npm run build    # Сборка
npm run lint     # Линтинг
npm run tunnel   # LocalTunnel (qazqar-demo.loca.lt)
```
