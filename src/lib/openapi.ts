export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "QazQar API",
    description: "API платформы аренды автомобилей QazQar (Астана, Казахстан)",
    version: "1.0.0",
  },
  servers: [
    { url: "http://localhost:3000", description: "Local" },
    { url: "https://qazqar.yume.cloud", description: "Production" },
  ],
  tags: [
    { name: "Auth", description: "Аутентификация" },
    { name: "Catalog", description: "Каталог автомобилей (публичный)" },
    { name: "Bookings", description: "Бронирование (публичный)" },
    { name: "Cabinet", description: "Личный кабинет (требует авторизации)" },
    { name: "Admin › Cars", description: "Управление автомобилями" },
    { name: "Admin › Bookings", description: "Управление заявками" },
    { name: "Admin › Users", description: "Управление пользователями" },
    { name: "Admin › Content", description: "Контент: блог, FAQ, отзывы, скидки" },
    { name: "Admin › Media", description: "Медиа: фото, загрузка" },
    { name: "Admin › Sync", description: "Синхронизация с Yume CRM" },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "access_token",
      },
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          email: { type: "string", format: "email" },
          firstName: { type: "string" },
          lastName: { type: "string" },
          role: { type: "string", enum: ["CLIENT", "ADMIN"] },
        },
      },
      Car: {
        type: "object",
        properties: {
          id: { type: "string" },
          slug: { type: "string" },
          year: { type: "integer" },
          color: { type: "string" },
          transmission: { type: "string", enum: ["AUTOMATIC", "MANUAL"] },
          fuelType: { type: "string", enum: ["AI92", "AI95", "AI98", "DIESEL"] },
          seats: { type: "integer" },
          hasAC: { type: "boolean" },
          pricePerDay: { type: "integer" },
          status: { type: "string", enum: ["AVAILABLE", "RENTED", "MAINTENANCE"] },
          photos: { type: "array", items: { type: "string" } },
          modelName: { type: "string" },
          brand: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              logoUrl: { type: "string", nullable: true },
            },
          },
        },
      },
      Booking: {
        type: "object",
        properties: {
          id: { type: "string" },
          carId: { type: "string" },
          customerName: { type: "string" },
          customerPhone: { type: "string" },
          startDate: { type: "string", format: "date-time" },
          endDate: { type: "string", format: "date-time" },
          totalPrice: { type: "integer" },
          discountPercent: { type: "integer" },
          status: { type: "string", enum: ["PENDING", "CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED"] },
          comment: { type: "string", nullable: true },
        },
      },
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
        },
      },
    },
  },
  paths: {
    // ─── AUTH ─────────────────────────────────────────────────────────────────
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Вход по email + пароль",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email", example: "admin@qazqar.kz" },
                  password: { type: "string", example: "password123" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Успешный вход",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: { $ref: "#/components/schemas/User" },
                    accessToken: { type: "string" },
                    refreshToken: { type: "string" },
                  },
                },
              },
            },
          },
          401: { description: "Неверные учётные данные" },
        },
      },
    },
    "/api/auth/login-otp": {
      post: {
        tags: ["Auth"],
        summary: "Вход по OTP-коду",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "code"],
                properties: {
                  email: { type: "string", format: "email" },
                  code: { type: "string", example: "123456" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Успешный вход" },
          400: { description: "Неверный код" },
        },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Регистрация нового пользователя",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["firstName", "lastName", "email", "password", "otpCode"],
                properties: {
                  firstName: { type: "string", example: "Иван" },
                  lastName: { type: "string", example: "Иванов" },
                  email: { type: "string", format: "email" },
                  phone: { type: "string", example: "+77001234567" },
                  password: { type: "string" },
                  otpCode: { type: "string", example: "123456" },
                  iin: { type: "string", example: "900101300123" },
                  isResident: { type: "boolean", default: true },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Успешная регистрация" },
          400: { description: "Ошибка валидации" },
          409: { description: "Email уже существует" },
        },
      },
    },
    "/api/auth/send-otp": {
      post: {
        tags: ["Auth"],
        summary: "Отправить OTP-код на email",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "type"],
                properties: {
                  email: { type: "string", format: "email" },
                  type: { type: "string", enum: ["REGISTER", "RESET_PASSWORD", "LOGIN"] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Код отправлен" },
        },
      },
    },
    "/api/auth/verify-otp": {
      post: {
        tags: ["Auth"],
        summary: "Проверить OTP-код",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "code", "type"],
                properties: {
                  email: { type: "string", format: "email" },
                  code: { type: "string" },
                  type: { type: "string", enum: ["REGISTER", "RESET_PASSWORD", "LOGIN"] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Код верный" },
          400: { description: "Код неверный или истёк" },
        },
      },
    },
    "/api/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Сброс пароля",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "code", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  code: { type: "string" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Пароль изменён" },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Текущий пользователь",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: "Данные пользователя" },
          401: { description: "Не авторизован" },
        },
      },
    },
    "/api/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Обновить access token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["refreshToken"],
                properties: {
                  refreshToken: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Новые токены" },
          401: { description: "Невалидный refresh token" },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Выход",
        security: [{ cookieAuth: [] }],
        responses: {
          200: { description: "Успешный выход" },
        },
      },
    },
    "/api/auth/check-email": {
      get: {
        tags: ["Auth"],
        summary: "Проверить существование email",
        parameters: [
          { name: "email", in: "query", required: true, schema: { type: "string", format: "email" } },
        ],
        responses: {
          200: {
            description: "Результат проверки",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { exists: { type: "boolean" } },
                },
              },
            },
          },
        },
      },
    },

    // ─── CATALOG ──────────────────────────────────────────────────────────────
    "/api/catalog": {
      get: {
        tags: ["Catalog"],
        summary: "Список доступных автомобилей",
        parameters: [
          { name: "brandId", in: "query", schema: { type: "string" } },
          { name: "transmission", in: "query", schema: { type: "string", enum: ["AUTOMATIC", "MANUAL"] } },
          { name: "fuelType", in: "query", schema: { type: "string", enum: ["AI92", "AI95", "AI98", "DIESEL"] } },
          { name: "minSeats", in: "query", schema: { type: "integer" } },
          { name: "minPrice", in: "query", schema: { type: "integer" } },
          { name: "maxPrice", in: "query", schema: { type: "integer" } },
          { name: "dateStart", in: "query", schema: { type: "string", format: "date" }, description: "YYYY-MM-DD" },
          { name: "dateEnd", in: "query", schema: { type: "string", format: "date" }, description: "YYYY-MM-DD" },
        ],
        responses: {
          200: {
            description: "Список автомобилей",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Car" } },
              },
            },
          },
        },
      },
    },
    "/api/catalog/{id}": {
      get: {
        tags: ["Catalog"],
        summary: "Автомобиль по ID или slug",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Данные автомобиля" },
          404: { description: "Не найден" },
        },
      },
    },
    "/api/catalog/{id}/price": {
      get: {
        tags: ["Catalog"],
        summary: "Рассчитать стоимость аренды",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "startDate", in: "query", required: true, schema: { type: "string" }, description: "YYYY-MM-DD HH:MM" },
          { name: "endDate", in: "query", required: true, schema: { type: "string" }, description: "YYYY-MM-DD HH:MM" },
        ],
        responses: {
          200: {
            description: "Стоимость",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    days: { type: "integer" },
                    pricePerDay: { type: "integer" },
                    discountPercent: { type: "integer" },
                    totalPrice: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/catalog/grouped": {
      get: {
        tags: ["Catalog"],
        summary: "Сгруппированный каталог (как на сайте)",
        description: "Группирует машины по модели + год + цвет + цена. Возвращает представителя группы с полями `availableCount` и `totalCount`. Сортировка: свободные первыми.",
        parameters: [
          { name: "brand", in: "query", schema: { type: "string" }, description: "Slug марки" },
          { name: "transmission", in: "query", schema: { type: "string", enum: ["AUTOMATIC", "MANUAL"] } },
          { name: "priceMin", in: "query", schema: { type: "integer" } },
          { name: "priceMax", in: "query", schema: { type: "integer" } },
          { name: "dateFrom", in: "query", schema: { type: "string", format: "date" }, description: "YYYY-MM-DD" },
          { name: "dateTo", in: "query", schema: { type: "string", format: "date" }, description: "YYYY-MM-DD" },
        ],
        responses: {
          200: {
            description: "Массив групп автомобилей",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    allOf: [
                      { $ref: "#/components/schemas/Car" },
                      {
                        type: "object",
                        properties: {
                          availableCount: { type: "integer", description: "Кол-во свободных в группе" },
                          totalCount: { type: "integer", description: "Всего в группе" },
                          availableFrom: { type: "string", format: "date-time", nullable: true },
                          nextBookingAt: { type: "string", format: "date-time", nullable: true },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/catalog/brands": {
      get: {
        tags: ["Catalog"],
        summary: "Список марок автомобилей",
        responses: {
          200: { description: "Массив марок" },
        },
      },
    },

    // ─── BOOKINGS ─────────────────────────────────────────────────────────────
    "/api/bookings": {
      post: {
        tags: ["Bookings"],
        summary: "Создать заявку на аренду",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["carId", "customerName", "customerPhone", "startDate", "endDate"],
                properties: {
                  carId: { type: "string" },
                  customerName: { type: "string", example: "Иван Иванов" },
                  customerPhone: { type: "string", example: "+77001234567" },
                  customerEmail: { type: "string", format: "email" },
                  customerIin: { type: "string" },
                  isResident: { type: "boolean", default: true },
                  otpCode: { type: "string", description: "Для быстрой регистрации" },
                  startDate: { type: "string", example: "2026-04-20 10:00" },
                  endDate: { type: "string", example: "2026-04-25 10:00" },
                  comment: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Заявка создана",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    bookingId: { type: "string" },
                    newUser: { type: "boolean" },
                  },
                },
              },
            },
          },
          409: { description: "Конфликт дат (DATE_CONFLICT)" },
        },
      },
    },

    // ─── FAQ / ADDRESSES ──────────────────────────────────────────────────────
    "/api/faq": {
      get: {
        tags: ["Catalog"],
        summary: "Список FAQ",
        responses: { 200: { description: "Массив вопросов и ответов" } },
      },
    },
    "/api/addresses": {
      get: {
        tags: ["Catalog"],
        summary: "Список адресов выдачи",
        responses: { 200: { description: "Массив адресов" } },
      },
    },

    // ─── CABINET ──────────────────────────────────────────────────────────────
    "/api/cabinet/profile": {
      get: {
        tags: ["Cabinet"],
        summary: "Профиль текущего пользователя",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: "Данные профиля" },
          401: { description: "Не авторизован" },
        },
      },
      put: {
        tags: ["Cabinet"],
        summary: "Обновить профиль",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  firstName: { type: "string" },
                  lastName: { type: "string" },
                  phone: { type: "string" },
                  currentPassword: { type: "string" },
                  newPassword: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Профиль обновлён" },
          400: { description: "Ошибка (WRONG_PASSWORD)" },
        },
      },
    },
    "/api/cabinet/bookings": {
      get: {
        tags: ["Cabinet"],
        summary: "Заявки текущего пользователя",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: { 200: { description: "Массив заявок" } },
      },
    },
    "/api/cabinet/bookings/{id}": {
      patch: {
        tags: ["Cabinet"],
        summary: "Отменить заявку (пользователь)",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", enum: ["CANCELLED"] },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Статус обновлён" } },
      },
    },
    "/api/cabinet/bookings/{id}/close": {
      post: {
        tags: ["Cabinet"],
        summary: "Закрыть заявку",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { 200: { description: "Заявка закрыта" } },
      },
    },
    "/api/cabinet/sync-bookings": {
      post: {
        tags: ["Cabinet"],
        summary: "Синхронизировать заявки из CRM",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: { 200: { description: "Синхронизировано" } },
      },
    },

    // ─── ADMIN › CARS ─────────────────────────────────────────────────────────
    "/api/admin/cars": {
      get: {
        tags: ["Admin › Cars"],
        summary: "Список всех автомобилей",
        security: [{ cookieAuth: [] }],
        responses: { 200: { description: "Массив автомобилей" } },
      },
      post: {
        tags: ["Admin › Cars"],
        summary: "Создать автомобиль",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["modelId", "number", "year", "color", "slug"],
                properties: {
                  modelId: { type: "string" },
                  inventoryId: { type: "integer" },
                  number: { type: "string", example: "546CQ01" },
                  year: { type: "integer", example: 2023 },
                  color: { type: "string", example: "Белый" },
                  transmission: { type: "string", enum: ["AUTOMATIC", "MANUAL"], default: "AUTOMATIC" },
                  fuelType: { type: "string", enum: ["AI92", "AI95", "AI98", "DIESEL"], default: "AI92" },
                  seats: { type: "integer", default: 5 },
                  hasAC: { type: "boolean", default: true },
                  pricePerDay: { type: "integer", example: 15000 },
                  slug: { type: "string", example: "hyundai-accent-2023-white" },
                  descriptionRu: { type: "string", nullable: true },
                  descriptionKz: { type: "string", nullable: true },
                  images: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Создан" } },
      },
    },
    "/api/admin/cars/{id}": {
      get: {
        tags: ["Admin › Cars"],
        summary: "Автомобиль по ID",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Данные автомобиля" } },
      },
      put: {
        tags: ["Admin › Cars"],
        summary: "Обновить автомобиль",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  images: { type: "array", items: { type: "string" }, description: "Массив URL фотографий" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Обновлён" } },
      },
      delete: {
        tags: ["Admin › Cars"],
        summary: "Удалить автомобиль",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Удалён" } },
      },
    },

    // ─── ADMIN › BOOKINGS ─────────────────────────────────────────────────────
    "/api/admin/bookings": {
      get: {
        tags: ["Admin › Bookings"],
        summary: "Список заявок",
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: { 200: { description: "Массив заявок" } },
      },
    },
    "/api/admin/bookings/{id}": {
      get: {
        tags: ["Admin › Bookings"],
        summary: "Заявка по ID",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Данные заявки" } },
      },
      patch: {
        tags: ["Admin › Bookings"],
        summary: "Обновить статус заявки",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", enum: ["PENDING", "CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED"] },
                  cancellationReason: { type: "string" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Обновлено" } },
      },
    },

    // ─── ADMIN › USERS ────────────────────────────────────────────────────────
    "/api/admin/users": {
      get: {
        tags: ["Admin › Users"],
        summary: "Список пользователей",
        security: [{ cookieAuth: [] }],
        responses: { 200: { description: "Массив пользователей" } },
      },
    },
    "/api/admin/users/{id}": {
      patch: {
        tags: ["Admin › Users"],
        summary: "Обновить пользователя",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Обновлён" } },
      },
      delete: {
        tags: ["Admin › Users"],
        summary: "Удалить пользователя",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Удалён" } },
      },
    },

    // ─── ADMIN › CONTENT ──────────────────────────────────────────────────────
    "/api/admin/reviews": {
      get: { tags: ["Admin › Content"], summary: "Список отзывов", security: [{ cookieAuth: [] }], responses: { 200: { description: "Массив" } } },
      post: { tags: ["Admin › Content"], summary: "Создать отзыв", security: [{ cookieAuth: [] }], requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { authorName: { type: "string" }, rating: { type: "integer", minimum: 1, maximum: 5 }, textRu: { type: "string" }, textKz: { type: "string" }, approved: { type: "boolean" } } } } } }, responses: { 201: { description: "Создан" } } },
    },
    "/api/admin/reviews/{id}": {
      patch: { tags: ["Admin › Content"], summary: "Обновить отзыв (approve/reject)", security: [{ cookieAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { approved: { type: "boolean" } } } } } }, responses: { 200: { description: "Обновлён" } } },
      delete: { tags: ["Admin › Content"], summary: "Удалить отзыв", security: [{ cookieAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Удалён" } } },
    },
    "/api/admin/discounts": {
      get: { tags: ["Admin › Content"], summary: "Список скидок", security: [{ cookieAuth: [] }], responses: { 200: { description: "Массив" } } },
      post: { tags: ["Admin › Content"], summary: "Создать скидку", security: [{ cookieAuth: [] }], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["minDays", "maxDays", "percent"], properties: { minDays: { type: "integer" }, maxDays: { type: "integer" }, percent: { type: "integer" }, active: { type: "boolean", default: true } } } } } }, responses: { 201: { description: "Создана" } } },
    },
    "/api/admin/faq": {
      get: { tags: ["Admin › Content"], summary: "Список FAQ", security: [{ cookieAuth: [] }], responses: { 200: { description: "Массив" } } },
      post: { tags: ["Admin › Content"], summary: "Создать FAQ", security: [{ cookieAuth: [] }], requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { questionRu: { type: "string" }, questionKz: { type: "string" }, answerRu: { type: "string" }, answerKz: { type: "string" } } } } } }, responses: { 201: { description: "Создан" } } },
    },
    "/api/admin/blog": {
      get: { tags: ["Admin › Content"], summary: "Список статей блога", security: [{ cookieAuth: [] }], responses: { 200: { description: "Массив" } } },
      post: { tags: ["Admin › Content"], summary: "Создать статью", security: [{ cookieAuth: [] }], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["slug", "titleRu", "contentRu"], properties: { slug: { type: "string" }, titleRu: { type: "string" }, titleKz: { type: "string" }, contentRu: { type: "string" }, contentKz: { type: "string" }, published: { type: "boolean", default: false } } } } } }, responses: { 201: { description: "Создана" } } },
    },

    // ─── ADMIN › MEDIA ────────────────────────────────────────────────────────
    "/api/admin/photos": {
      get: { tags: ["Admin › Media"], summary: "Список всех фото", security: [{ cookieAuth: [] }], responses: { 200: { description: "Массив фото" } } },
      post: {
        tags: ["Admin › Media"],
        summary: "Сохранить фото в БД",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["url"],
                properties: {
                  url: { type: "string" },
                  name: { type: "string" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Создано" } },
      },
    },
    "/api/admin/photos/{id}": {
      delete: {
        tags: ["Admin › Media"],
        summary: "Удалить фото (БД + MinIO)",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Удалено" } },
      },
    },
    "/api/admin/upload": {
      post: {
        tags: ["Admin › Media"],
        summary: "Загрузить файл в MinIO",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "URL загруженного файла",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    url: { type: "string" },
                    fileName: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/admin/minio-restore": {
      get: { tags: ["Admin › Media"], summary: "Список объектов в MinIO", security: [{ cookieAuth: [] }], responses: { 200: { description: "Объекты" } } },
      post: { tags: ["Admin › Media"], summary: "Восстановить фото из MinIO в БД", security: [{ cookieAuth: [] }], responses: { 200: { description: "Результат восстановления" } } },
    },

    // ─── ADMIN › SYNC ─────────────────────────────────────────────────────────
    "/api/admin/sync": {
      get: {
        tags: ["Admin › Sync"],
        summary: "Статус синхронизации с Yume CRM",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "Статус",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    lastSyncAt: { type: "string", format: "date-time", nullable: true },
                    lastInventorySyncAt: { type: "string", format: "date-time", nullable: true },
                    nextSyncAt: { type: "string", format: "date-time", nullable: true },
                    result: {
                      type: "object",
                      nullable: true,
                      properties: {
                        cars: { type: "integer" },
                        rented: { type: "integer" },
                        booked: { type: "integer" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Admin › Sync"],
        summary: "Принудительная синхронизация",
        security: [{ cookieAuth: [] }],
        responses: { 200: { description: "Синхронизация выполнена" } },
      },
    },
    "/api/admin/addresses": {
      get: { tags: ["Admin › Content"], summary: "Список адресов", security: [{ cookieAuth: [] }], responses: { 200: { description: "Массив" } } },
      post: { tags: ["Admin › Content"], summary: "Создать адрес", security: [{ cookieAuth: [] }], responses: { 201: { description: "Создан" } } },
    },
    "/api/admin/addresses/{id}": {
      put: { tags: ["Admin › Content"], summary: "Обновить адрес", security: [{ cookieAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Обновлён" } } },
      delete: { tags: ["Admin › Content"], summary: "Удалить адрес", security: [{ cookieAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Удалён" } } },
    },
    "/api/admin/brands": {
      get: { tags: ["Admin › Cars"], summary: "Список марок", security: [{ cookieAuth: [] }], responses: { 200: { description: "Массив" } } },
      post: { tags: ["Admin › Cars"], summary: "Создать марку", security: [{ cookieAuth: [] }], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["name", "slug"], properties: { name: { type: "string" }, slug: { type: "string" } } } } } }, responses: { 201: { description: "Создана" } } },
    },
    "/api/admin/brands/{id}": {
      put: { tags: ["Admin › Cars"], summary: "Обновить марку", security: [{ cookieAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Обновлена" } } },
      delete: { tags: ["Admin › Cars"], summary: "Удалить марку", security: [{ cookieAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Удалена" } } },
    },
    "/api/admin/models": {
      get: { tags: ["Admin › Cars"], summary: "Список моделей", security: [{ cookieAuth: [] }], responses: { 200: { description: "Массив" } } },
      post: { tags: ["Admin › Cars"], summary: "Создать модель", security: [{ cookieAuth: [] }], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["name", "slug", "brandId"], properties: { name: { type: "string" }, slug: { type: "string" }, brandId: { type: "string" } } } } } }, responses: { 201: { description: "Создана" } } },
    },
  },
};
