# Документы на подписание в списке бронирований

## Контекст

При подтверждении заявки (CONFIRMED) в CRM генерируются документы на подписание. Нужно показать эти документы в списке бронирований в личном кабинете — название, ссылка на подписание, статус (подписан/нет).

## API

- **Получение документов:** `GET /v2/documents/?content_type=orderrequest&object_id={requestId}`
- **Ссылка на подписание:** `https://yume.kz/documents/{signs[].uuid}`
- **Статус подписи:** `document.signed` (boolean) или `signs[].status` (0=draft, 2=signed)

Пример ответа (заявка #956):
```json
{
  "results": [{
    "name": "Договор аренды - 956",
    "uuid": "89481f85-...",
    "signed": false,
    "signs": [{
      "uuid": "dee329dd-...",  // ← ссылка для подписания
      "status": 2
    }]
  }]
}
```

## Подход

Загружать документы on-demand при рендере страницы бронирований (серверный компонент). Без хранения в БД — данные всегда актуальны из CRM.

## Изменения

### 1. `src/lib/yume/api.ts` — метод получения документов

Метод `getRequestDocuments` уже добавлен. Нужно:
- Типизировать ответ (`YumeDocument`, `YumeDocumentSign`)
- Возвращать `results[]`

### 2. `src/app/[locale]/cabinet/bookings/page.tsx` — загрузка документов

Для каждого бронирования с `requestId` и статусом не PENDING/CANCELLED — запросить документы из CRM. Передать в компонент.

### 3. `src/components/cabinet/BookingsList.tsx` — отображение документов

В карточке бронирования (для CONFIRMED и ACTIVE) показать блок документов:
```
📄 Договор аренды          Подписать →
📄 Акт приема передачи     ✓ Подписан
📄 Путевой лист            Подписать →
```

- Ссылка ведёт на `https://yume.kz/documents/{sign_uuid}` (target="_blank")
- Подписанные — зелёным с галочкой, неподписанные — ссылкой

### 4. `src/i18n/messages/ru.json` и `kz.json` — переводы

```
cabinet.documents — "Документы"
cabinet.sign — "Подписать"
cabinet.signed — "Подписан"
```

## Файлы

| Файл | Действие |
|------|----------|
| `src/lib/yume/api.ts` | Типизировать getRequestDocuments |
| `src/app/[locale]/cabinet/bookings/page.tsx` | Загрузить документы для бронирований |
| `src/components/cabinet/BookingsList.tsx` | Показать документы в карточке |
| `src/i18n/messages/ru.json` | Переводы |
| `src/i18n/messages/kz.json` | Переводы |

## Проверка

1. Открыть `/cabinet/bookings`
2. У забронированной/активной заявки с requestId должны отобразиться документы
3. Ссылка "Подписать" ведёт на `https://yume.kz/documents/{uuid}` в новой вкладке
4. Подписанные документы показывают "Подписан" с галочкой
