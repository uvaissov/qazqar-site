"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import LanguageSwitcher from "./LanguageSwitcher";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
}

const navItems = [
  { key: "home", href: "/" },
  { key: "about", href: "/#about" },
  { key: "discounts", href: "/#discounts" },
  { key: "reviews", href: "/#reviews" },
  { key: "terms", href: "/#faq" },
  { key: "blog", href: "/blog" },
] as const;

export default function MobileMenu({ open, onClose, isLoggedIn }: MobileMenuProps) {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");

  return (
    <div
      className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
        open ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
      }`}
    >
      <nav className="bg-white border-t border-gray-100 px-4 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            onClick={onClose}
            className="block px-3 py-2 text-gray-700 hover:text-cyan-500 hover:bg-gray-50 rounded-md transition-colors"
          >
            {t(item.key)}
          </Link>
        ))}

        <Link
          href="/catalog"
          onClick={onClose}
          className="block px-3 py-2 text-cyan-500 font-semibold hover:bg-cyan-50 rounded-md transition-colors"
        >
          {t("catalog")}
        </Link>

        {isLoggedIn ? (
          <Link
            href="/cabinet"
            onClick={onClose}
            className="block px-3 py-2 text-gray-700 hover:text-cyan-500 hover:bg-gray-50 rounded-md transition-colors"
          >
            {t("cabinet")}
          </Link>
        ) : (
          <Link
            href="/login"
            onClick={onClose}
            className="block px-3 py-2 text-gray-700 hover:text-cyan-500 hover:bg-gray-50 rounded-md transition-colors"
          >
            {t("login")}
          </Link>
        )}

        <div className="border-t border-gray-100 pt-3 mt-3">
          <a
            href={`tel:${tCommon("phone").replace(/\s/g, "")}`}
            className="block px-3 py-2 text-gray-700 hover:text-cyan-500 font-medium"
          >
            {tCommon("phone")}
          </a>
        </div>

        <div className="px-3 py-2">
          <LanguageSwitcher />
        </div>
      </nav>
    </div>
  );
}
