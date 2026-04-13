"use client";

import { Link } from "@/i18n/routing";
import { usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export default function CabinetNav() {
  const t = useTranslations("cabinet");
  const pathname = usePathname();

  const links = [
    { href: "/cabinet/bookings", label: t("bookings") },
    { href: "/cabinet/profile", label: t("profile") },
  ];

  return (
    <nav className="flex gap-6 -mb-px">
      {links.map((link) => {
        const isActive = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
              isActive
                ? "border-cyan-500 text-cyan-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
