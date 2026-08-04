import { describe, expect, test } from "vitest";
import { normalizePhone, phoneSearchVariants, formatPhone } from "./phone";

describe("normalizePhone — резидент", () => {
  const resident = { resident: true };

  test("оставляет канонический номер без изменений", () => {
    expect(normalizePhone("+77051023353", resident)).toEqual({
      ok: true,
      phone: "+77051023353",
    });
  });

  test("заменяет ведущую 8 на код страны 7", () => {
    expect(normalizePhone("87051023353", resident)).toEqual({
      ok: true,
      phone: "+77051023353",
    });
  });

  test("дописывает код страны к 10 цифрам", () => {
    expect(normalizePhone("7051023353", resident)).toEqual({
      ok: true,
      phone: "+77051023353",
    });
  });

  test("выбрасывает скобки, дефисы и пробелы", () => {
    expect(normalizePhone("+7 (705) 102-33-53", resident)).toEqual({
      ok: true,
      phone: "+77051023353",
    });
  });

  test("принимает запись через 8 с разделителями", () => {
    expect(normalizePhone("8 705 102 33 53", resident)).toEqual({
      ok: true,
      phone: "+77051023353",
    });
  });

  test("отбрасывает короткий номер", () => {
    expect(normalizePhone("7700123", resident)).toEqual({
      ok: false,
      error: "INVALID_PHONE",
    });
  });

  test("отбрасывает слишком длинный номер", () => {
    expect(normalizePhone("+770510233531234", resident)).toEqual({
      ok: false,
      error: "INVALID_PHONE",
    });
  });

  test("отбрасывает строку без цифр", () => {
    expect(normalizePhone("не телефон", resident)).toEqual({
      ok: false,
      error: "INVALID_PHONE",
    });
  });

  test("отбрасывает пустую строку", () => {
    expect(normalizePhone("", resident)).toEqual({
      ok: false,
      error: "INVALID_PHONE",
    });
  });

  test("отбрасывает иностранный номер у резидента", () => {
    expect(normalizePhone("+491701234567", resident)).toEqual({
      ok: false,
      error: "INVALID_PHONE",
    });
  });
});

describe("normalizePhone — нерезидент", () => {
  const foreign = { resident: false };

  test("принимает иностранный номер в E.164", () => {
    expect(normalizePhone("+491701234567", foreign)).toEqual({
      ok: true,
      phone: "+491701234567",
    });
  });

  test("выбрасывает разделители из иностранного номера", () => {
    expect(normalizePhone("+49 170 123-45-67", foreign)).toEqual({
      ok: true,
      phone: "+491701234567",
    });
  });

  test("приводит казахстанский номер к тем же правилам, что у резидента", () => {
    expect(normalizePhone("87051023353", foreign)).toEqual({
      ok: true,
      phone: "+77051023353",
    });
  });

  test("требует код страны — номер без плюса не проходит", () => {
    expect(normalizePhone("1701234567", foreign)).toEqual({
      ok: false,
      error: "INVALID_PHONE",
    });
  });

  test("отбрасывает слишком короткий международный номер", () => {
    expect(normalizePhone("+4917", foreign)).toEqual({
      ok: false,
      error: "INVALID_PHONE",
    });
  });
});

describe("phoneSearchVariants", () => {
  test("для казахстанского номера даёт три записи для поиска в CRM", () => {
    expect(phoneSearchVariants("+77051023353")).toEqual([
      "+77051023353",
      "77051023353",
      "87051023353",
    ]);
  });

  test("для иностранного номера даёт две записи", () => {
    expect(phoneSearchVariants("+491701234567")).toEqual([
      "+491701234567",
      "491701234567",
    ]);
  });
});

describe("formatPhone", () => {
  test("показывает казахстанский номер по маске", () => {
    expect(formatPhone("+77051023353")).toBe("+7 705 102 33 53");
  });

  test("иностранный номер оставляет как есть", () => {
    expect(formatPhone("+491701234567")).toBe("+491701234567");
  });

  test("ненормализованное значение возвращает без изменений", () => {
    expect(formatPhone("87051023353")).toBe("87051023353");
  });
});
