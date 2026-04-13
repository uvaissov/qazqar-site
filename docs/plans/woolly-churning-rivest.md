# Фильтр дат в каталоге

## Контекст
Пользователь хочет искать машины, свободные на конкретный период. Сейчас каталог фильтрует только по марке, трансмиссии и цене — нет возможности проверить доступность на даты.

## Что делаем
Добавляем фильтр дат аренды (с/по) + 4 пресет-кнопки: **1 день, 3 дня, Неделя, Месяц**.

## Файлы

| Файл | Изменение |
|------|-----------|
| `src/i18n/messages/ru.json` | Новые ключи: dateLabel, dateFrom, dateTo, preset* |
| `src/i18n/messages/kz.json` | Аналогичные ключи на казахском |
| `src/lib/data/cars.ts` | `getCars()` — фильтрация по dateFrom/dateTo |
| `src/app/[locale]/(public)/catalog/page.tsx` | Прокинуть dateFrom/dateTo из searchParams |
| `src/components/catalog/CatalogFilters.tsx` | UI: дата-инпуты + пресеты |

## Логика фильтрации (getCars)

Машина **доступна** на период `[dateFrom, dateTo]` если:
1. Не в `MAINTENANCE`
2. Если `RENTED` — `availableFrom <= dateFrom` (освободится к началу)
3. Нет пересекающихся бронирований (кроме CANCELLED): `startDate < dateTo AND endDate > dateFrom`

```ts
where.OR = [
  { status: "AVAILABLE" },
  { status: "RENTED", availableFrom: { lte: from } },
];
where.bookings = {
  none: {
    status: { not: "CANCELLED" },
    startDate: { lt: to },
    endDate: { gt: from },
  },
};
```

## UI

Новая секция **над** существующей сеткой фильтров (внутри glass-карточки):

```
[Даты аренды]
[input С] [input По]  [1 день] [3 дня] [Неделя] [Месяц]
```

- Native `<input type="date">` (как в BookingForm)
- Пресеты начинаются с **завтра**, задают dateFrom и dateTo
- Фильтр применяется по onChange (дата-пикер коммитит сразу при выборе)
- На мобиле: инпуты и кнопки стекаются в два ряда

## Порядок
1. Переводы → 2. getCars() → 3. page.tsx → 4. CatalogFilters.tsx

## Проверка
- Открыть каталог, нажать "Неделя" → URL получает `?dateFrom=...&dateTo=...`
- Машины с конфликтующими бронированиями исключаются
- Сброс фильтров очищает даты
- Ручной ввод дат работает
