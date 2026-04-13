"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import LanguageSwitcher from "./LanguageSwitcher";
import MobileMenu from "./MobileMenu";

const navItems = [
  { key: "home", href: "/" },
  { key: "about", href: "/#about" },
  { key: "discounts", href: "/#discounts" },
  { key: "reviews", href: "/#reviews" },
  { key: "terms", href: "/#faq" },
  { key: "blog", href: "/blog" },
] as const;

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");

  useEffect(() => {
    function checkAuth() {
      fetch("/api/auth/me")
        .then((res) => setIsLoggedIn(res.ok))
        .catch(() => setIsLoggedIn(false));
    }

    checkAuth();

    // Listen for auth state changes from other components
    window.addEventListener("auth-changed", checkAuth);
    return () => window.removeEventListener("auth-changed", checkAuth);
  }, []);

  return (
    <header className="sticky top-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/images/logo.png"
              alt="Qazqar"
              width={140}
              height={33}
              priority
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="text-sm text-gray-700 hover:text-cyan-500 transition-colors"
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>

          {/* Right side: phone, lang, catalog CTA */}
          <div className="hidden lg:flex items-center gap-4">
            <a
              href={`tel:${tCommon("phone").replace(/\s/g, "")}`}
              className="text-sm font-medium text-gray-700 hover:text-cyan-500 transition-colors"
            >
              {tCommon("phone")}
            </a>

            <LanguageSwitcher />

            {isLoggedIn ? (
              <Link
                href="/cabinet"
                className="text-sm font-medium text-gray-700 hover:text-cyan-500 transition-colors"
              >
                {t("cabinet")}
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium text-gray-700 hover:text-cyan-500 transition-colors"
              >
                {t("login")}
              </Link>
            )}

            <Link
              href="/catalog"
              className="inline-flex items-center px-4 py-2 bg-cyan-500 text-white text-sm font-semibold rounded-lg hover:bg-cyan-600 transition-colors"
            >
              {t("catalog")}
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-cyan-500 hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        isLoggedIn={isLoggedIn}
      />
    </header>
  );
}
