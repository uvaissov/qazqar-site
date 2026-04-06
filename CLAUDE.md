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

## Команды

```bash
npm run dev      # Запуск dev-сервера (порт 3002, Turbopack)
npm run build    # Сборка
npm run lint     # Линтинг
npm run tunnel   # LocalTunnel (qazqar-demo.loca.lt)
```
