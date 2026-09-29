// Русский блог живёт по адресам старого сайта (/p, /p/{slug}) — они проиндексированы
// Google и Яндексом. Отдаются rewrite'ом из next.config.ts на /ru/blog/*,
// а /ru/blog/* наоборот 301-редиректит сюда, чтобы не было дублей.
// Казахская версия — обычная /kz/blog/*.
export function blogPath(locale: string, slug?: string): string {
  const base = locale === "kz" ? "/kz/blog" : "/p";
  return slug ? `${base}/${slug}` : base;
}
