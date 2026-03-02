"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface AdminHeaderProps {
  user: {
    email: string;
  };
}

export default function AdminHeader({ user }: AdminHeaderProps) {
  const router = useRouter();
  const t = useTranslations("admin");
  const tAuth = useTranslations("auth");

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Left: breadcrumb / title */}
      <h1 className="text-lg font-semibold text-gray-800">{t("panel")}</h1>

      {/* Right: user info + logout */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">{user.email}</span>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
            />
          </svg>
          {tAuth("logout")}
        </button>
      </div>
    </header>
  );
}
