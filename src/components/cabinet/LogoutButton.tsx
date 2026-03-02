"use client";

import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export default function LogoutButton() {
  const t = useTranslations("auth");
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-gray-500 hover:text-red-600 transition-colors"
    >
      {t("logout")}
    </button>
  );
}
