// Единый источник правды по телефонным номерам.
//
// Порт qazqar_flutter/lib/utils/phone_formatter.dart — мобилка нормализует
// номера правильно с самого начала, веб этого не делал. Логика перенесена,
// а не написана заново, чтобы клиент и сервер не разъезжались.

/** Казахстанский номер: код страны 7 + 10 цифр. */
const KZ_LOCAL_DIGITS = 10;
const KZ_TOTAL_DIGITS = KZ_LOCAL_DIGITS + 1;

/** Границы E.164 для номеров нерезидентов. */
const E164_MIN_DIGITS = 8;
const E164_MAX_DIGITS = 15;

export type PhoneResult =
  | { ok: true; phone: string }
  | { ok: false; error: "INVALID_PHONE" };

const INVALID: PhoneResult = { ok: false, error: "INVALID_PHONE" };

function digitsOf(raw: string): string {
  return raw.replace(/\D+/g, "");
}

/**
 * Разбирает номер по казахстанским правилам: «8 705…», «+7 705…» и «705…»
 * дают один и тот же результат. Возвращает null, если номер не казахстанский.
 */
function toKzCanonical(raw: string): string | null {
  let digits = digitsOf(raw);

  if (digits.length === KZ_TOTAL_DIGITS && digits.startsWith("8")) {
    digits = "7" + digits.slice(1);
  } else if (digits.length === KZ_LOCAL_DIGITS) {
    digits = "7" + digits;
  }

  if (digits.length !== KZ_TOTAL_DIGITS || !digits.startsWith("7")) return null;
  return "+" + digits;
}

/**
 * Приводит номер к каноническому виду для БД и CRM.
 *
 * Резидент — всегда `+7XXXXXXXXXX`. Нерезидент — E.164 с любым кодом страны,
 * но казахстанский номер и у него приводится к тем же правилам.
 */
export function normalizePhone(
  raw: string,
  opts: { resident: boolean }
): PhoneResult {
  const trimmed = raw.trim();
  const digits = digitsOf(trimmed);

  if (opts.resident) {
    const kz = toKzCanonical(trimmed);
    return kz ? { ok: true, phone: kz } : INVALID;
  }

  // Нерезидент мог указать казахстанский номер — распознаём по коду страны,
  // но НЕ дописываем 7 к десятизначному вводу: у иностранца это чужой номер.
  const looksKz =
    digits.length === KZ_TOTAL_DIGITS &&
    (digits.startsWith("7") || digits.startsWith("8"));
  if (looksKz) {
    const kz = toKzCanonical(trimmed);
    if (kz) return { ok: true, phone: kz };
  }

  if (!trimmed.startsWith("+")) return INVALID;
  if (digits.length < E164_MIN_DIGITS || digits.length > E164_MAX_DIGITS) {
    return INVALID;
  }
  return { ok: true, phone: "+" + digits };
}

/**
 * Записи номера для fulltext-поиска в Yume CRM: там номер мог быть заведён
 * в любом из форматов, поэтому одного запроса мало.
 */
export function phoneSearchVariants(phone: string): string[] {
  const digits = digitsOf(phone);
  const variants = ["+" + digits, digits];
  if (digits.length === KZ_TOTAL_DIGITS && digits.startsWith("7")) {
    variants.push("8" + digits.slice(1));
  }
  return variants;
}

/** Человекочитаемый вид для интерфейса: +7 705 102 33 53. */
export function formatPhone(phone: string): string {
  const digits = digitsOf(phone);
  if (
    !phone.startsWith("+") ||
    digits.length !== KZ_TOTAL_DIGITS ||
    !digits.startsWith("7")
  ) {
    return phone;
  }
  const local = digits.slice(1);
  return `+7 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6, 8)} ${local.slice(8)}`;
}
