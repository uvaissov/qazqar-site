/**
 * Validate Kazakhstan IIN (Individual Identification Number)
 * Format: 12 digits, with checksum validation
 *
 * Structure: YYMMDDXNNNNC
 * YY - year of birth
 * MM - month of birth
 * DD - day of birth
 * X - century/gender digit (1-6)
 * NNNN - serial number
 * C - check digit
 */

const WEIGHTS_1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const WEIGHTS_2 = [3, 4, 5, 6, 7, 8, 9, 10, 11, 1, 2];

export function validateIin(iin: string): { valid: boolean; error?: string } {
  if (!/^\d{12}$/.test(iin)) {
    return { valid: false, error: "IIN_FORMAT" };
  }

  const digits = iin.split("").map(Number);

  // Validate birth date part
  const centuryDigit = digits[6];
  if (centuryDigit < 1 || centuryDigit > 6) {
    return { valid: false, error: "IIN_INVALID" };
  }

  const century = centuryDigit <= 2 ? 18 : centuryDigit <= 4 ? 19 : 20;
  const year = century * 100 + digits[0] * 10 + digits[1];
  const month = digits[2] * 10 + digits[3];
  const day = digits[4] * 10 + digits[5];

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return { valid: false, error: "IIN_INVALID" };
  }

  // Check if date is valid
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return { valid: false, error: "IIN_INVALID" };
  }

  // Checksum validation
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    sum += digits[i] * WEIGHTS_1[i];
  }

  let checkDigit = sum % 11;

  if (checkDigit === 10) {
    sum = 0;
    for (let i = 0; i < 11; i++) {
      sum += digits[i] * WEIGHTS_2[i];
    }
    checkDigit = sum % 11;

    if (checkDigit === 10) {
      return { valid: false, error: "IIN_CHECKSUM" };
    }
  }

  if (checkDigit !== digits[11]) {
    return { valid: false, error: "IIN_CHECKSUM" };
  }

  return { valid: true };
}
