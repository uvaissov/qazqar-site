# Plan: Группировка машин в каталоге

## Context
В каталоге отображаются все машины индивидуально. Если есть 3 одинаковых Toyota Camry 2024 белого цвета — пользователь видит 3 одинаковых карточки. Нужно группировать по (модель, год, цвет, цена) и показывать одну карточку с бейджем "3 авто".

## Подход
Группировка на уровне `getCars()` — после получения данных из БД группируем в JS. Ссылка ведёт на slug первого доступного авто из группы.

## Файлы для изменения

### 1. `src/lib/data/cars.ts` — новая функция `getGroupedCars()`
- Вызывает существующий `getCars(filters)`
- Группирует результат по ключу `${modelId}-${year}-${color}-${pricePerDay}`
- Возвращает массив объектов: данные первого авто группы + `availableCount` (кол-во AVAILABLE в группе) + `totalCount` (всего в группе)
- Для slug выбирает первый AVAILABLE авто, если нет — первый из группы

### 2. `src/components/ui/CarCard.tsx` — бейдж количества
- Новый опциональный проп `availableCount?: number`
- Если `availableCount > 1` — показывать бейдж (например "3 авто") рядом с годом

### 3. `src/components/catalog/CatalogGrid.tsx` — обновить тип
- Обновить тип `CarWithModel` — добавить `availableCount`, `totalCount`
- Прокинуть `availableCount` в `CarCard`

### 4. `src/app/[locale]/(public)/catalog/page.tsx` — использовать `getGroupedCars()`
- Заменить `getCars(filters)` на `getGroupedCars(filters)`
- Обновить счётчик: показывать количество групп

### 5. Переводы `src/i18n/messages/ru.json` и `kz.json`
- Добавить ключ `catalog.availableCars` — "авто" (для бейджа "3 авто")

## Логика группировки (в getCars.ts)
```
function groupCars(cars):
  groups = Map<string, Car[]>
  for car in cars:
    key = `${car.modelId}-${car.year}-${car.color}-${car.pricePerDay}`
    groups[key].push(car)
  
  return groups.map(group => {
    // Предпочитаем AVAILABLE авто для slug/фото
    representative = group.find(c => c.status === "AVAILABLE") || group[0]
    availableCount = group.filter(c => c.status === "AVAILABLE").length
    return { ...representative, availableCount, totalCount: group.length }
  })
```

## Верификация
1. Открыть каталог — одинаковые машины должны быть в одной карточке с бейджем
2. Клик по карточке — открывает детальную страницу конкретного авто
3. Фильтры (бренд, КПП, цена, даты) — группировка корректно работает с фильтрами
4. Счётчик "N авто" в хедере каталога — отражает количество групп
