"use client";

import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export default function LogoutButton() {
  const t = useTranslations("auth");
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.dispatchEvent(new Event("auth-changed"));
    router.push("/");
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full px-6 py-3 bg-red-50 border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-100 hover:border-red-300 transition-colors"
    >
      {t("logout")}
    </button>
  );
}
