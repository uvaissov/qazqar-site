export const locales = ["ru", "kz"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ru";
