"use client";

import { normalizePhone } from "@/lib/phone";

/**
 * Поле ввода телефона с маской +7 705 102 33 53.
 *
 * Наружу через `onChange` уходит канонический номер (`+77051023353`) либо сырая
 * строка, если она ещё не разбирается — маска остаётся косметикой, а решение
 * «валидно/нет» принимает сервер по тем же правилам (`@/lib/phone`).
 *
 * Для нерезидента маска отключается: у иностранного номера другая длина и код.
 */

/** Показывает ровно столько цифр, сколько ввели: +7 705 102 33 53. */
function maskKz(local: string): string {
  if (!local) return "";
  const parts = [
    local.slice(0, 3),
    local.slice(3, 6),
    local.slice(6, 8),
    local.slice(8, 10),
  ].filter(Boolean);
  return "+7 " + parts.join(" ");
}

/** Цифры номера без кода страны: «8 705…», «+7 705…» и «705…» дают одно и то же. */
function localDigits(raw: string): string {
  const hadPrefix = raw.trimStart().startsWith("+7");
  let digits = (hadPrefix ? raw.trimStart().slice(2) : raw).replace(/\D+/g, "");

  // Ведущая 8 — всегда код страны в старой записи (8 777…).
  if (digits.startsWith("8")) digits = digits.slice(1);
  // Ведущая 7 — код страны только при вставке целого номера («77771234567»).
  if (!hadPrefix && digits.length > 10 && digits.startsWith("7")) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 10);
}

type Props = {
  value: string;
  onChange: (canonical: string) => void;
  resident: boolean;
  id?: string;
  className?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
};

export default function PhoneInput({
  value,
  onChange,
  resident,
  id,
  className,
  placeholder,
  required,
  disabled,
}: Props) {
  const display = resident ? maskKz(localDigits(value)) : value;

  function handleChange(raw: string) {
    if (!resident) {
      onChange(raw.trim());
      return;
    }
    const local = localDigits(raw);
    const result = normalizePhone(local, { resident: true });
    // Пока номер неполный, отдаём то, что набрано: иначе поле нельзя стереть.
    onChange(result.ok ? result.phone : local);
  }

  return (
    <input
      id={id}
      type="tel"
      inputMode="tel"
      value={display}
      onChange={(e) => handleChange(e.target.value)}
      className={className}
      placeholder={placeholder ?? (resident ? "+7 700 000 00 00" : "+49 170 1234567")}
      required={required}
      disabled={disabled}
    />
  );
}
