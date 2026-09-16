/**
 * Ролевая модель админки.
 *
 * Роли:
 *  - CLIENT  — клиент, регистрируется сам, в админку не попадает;
 *  - MANAGER — менеджер: пользователи (просмотр, привязка к CRM), заявки,
 *              автопарк (авто, марки, синк с CRM), контент сайта; заводит
 *              его только админ;
 *  - ADMIN   — всё: плюс скидки, надбавки, настройки, создание сотрудников
 *              и назначение ролей.
 *
 * Права заданы по «секциям» админки, а не по отдельным роутам: одна секция —
 * одна строка в сайдбаре, одна группа API. Проверка на трёх уровнях читает
 * ЭТОТ файл: middleware (страницы /admin/*), `requireSection()` в API,
 * фильтр пунктов в сайдбаре. Файл без импортов — его тянет edge-middleware.
 */

export type StaffRole = "MANAGER" | "ADMIN";

export const ADMIN_SECTIONS = [
  "dashboard",
  "bookings",
  "users",
  "content", // блог, FAQ, отзывы, баннеры, медиа/загрузки
  "smsLog",
  "cars", // авто, марки/модели, синк с CRM
  "discounts",
  "surcharges",
  "settings", // настройки, адреса, восстановление MinIO
  "staff", // создание сотрудников и назначение ролей
] as const;

export type AdminSection = (typeof ADMIN_SECTIONS)[number];

const MANAGER_SECTIONS: ReadonlySet<AdminSection> = new Set<AdminSection>([
  "dashboard",
  "bookings",
  "users",
  "content",
  "smsLog",
  "cars",
]);

export function isStaffRole(role: unknown): role is StaffRole {
  return role === "MANAGER" || role === "ADMIN";
}

export function canAccess(role: unknown, section: AdminSection): boolean {
  if (role === "ADMIN") return true;
  if (role === "MANAGER") return MANAGER_SECTIONS.has(section);
  return false;
}

/**
 * Секция по URL страницы админки (без локали): `/admin/cars/new` → cars.
 * Неизвестный путь под /admin считаем админским — безопаснее закрыть.
 */
const PAGE_SECTIONS: Record<string, AdminSection> = {
  "": "dashboard",
  bookings: "bookings",
  users: "users",
  blog: "content",
  faq: "content",
  reviews: "content",
  banners: "content",
  media: "content",
  "sms-log": "smsLog",
  cars: "cars",
  brands: "cars",
  discounts: "discounts",
  surcharges: "surcharges",
  settings: "settings",
};

export function sectionForAdminPath(pathWithoutLocale: string): AdminSection {
  // "/admin", "/admin/", "/admin/cars/123/edit" → "cars"
  const rest = pathWithoutLocale.replace(/^\/admin\/?/, "");
  const head = rest.split("/")[0] ?? "";
  return PAGE_SECTIONS[head] ?? "settings";
}
