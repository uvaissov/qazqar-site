import { redirect } from "@/i18n/routing";
import { getLocale } from "next-intl/server";

export default async function CabinetPage() {
  const locale = await getLocale();
  redirect({ href: "/cabinet/bookings", locale });
}
