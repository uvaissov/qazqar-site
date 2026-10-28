"use client";

import { useTranslations } from "next-intl";

export default function AppDownloadLinks({ className = "" }: { className?: string }) {
  const t = useTranslations("appDownload");
  const buttonClass = "inline-flex min-h-14 items-center gap-3 rounded-xl border border-white/20 bg-gray-950 px-4 py-2 text-white transition-colors hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400";

  return (
    <div className={className}>
      <p className="mb-3 text-sm font-medium">{t("title")}</p>
      <div className="flex flex-wrap gap-3">
        <a
          href="https://play.google.com/store/apps/details?id=com.qazqar.qazqar&hl=ru"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("googlePlayLabel")}
          className={buttonClass}
        >
          <svg aria-hidden="true" viewBox="0 0 24 26" className="h-7 w-7 shrink-0">
            <path fill="#00D7FE" d="M1 1v24l12-12z" />
            <path fill="#00EF77" d="M1 1l15 9-3 3z" />
            <path fill="#FFCE00" d="M16 10l6 3-6 3-3-3z" />
            <path fill="#FF3A44" d="M1 25l12-12 3 3z" />
          </svg>
          <span>
            <span className="block text-[10px] leading-4 text-gray-300">{t("getOn")}</span>
            <span className="block text-lg font-semibold leading-6">Google Play</span>
          </span>
        </a>
        <a
          href="https://apps.apple.com/kz/app/qazqar/id6746720251"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("appStoreLabel")}
          className={buttonClass}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 shrink-0">
            <path d="M17.05 12.54c.03 3.21 2.82 4.28 2.85 4.29-.02.08-.45 1.53-1.47 3.03-.88 1.3-1.8 2.59-3.24 2.62-1.42.03-1.87-.84-3.5-.84-1.62 0-2.13.81-3.48.87-1.39.05-2.45-1.41-3.34-2.7-1.82-2.64-3.2-7.47-1.33-10.73.93-1.62 2.59-2.65 4.38-2.67 1.37-.03 2.66.92 3.5.92.84 0 2.42-1.14 4.08-.97.69.03 2.64.28 3.89 2.11-.1.06-2.37 1.38-2.34 4.07ZM14.36 4.61c.74-.89 1.24-2.13 1.1-3.36-1.07.04-2.38.72-3.15 1.61-.69.79-1.3 2.05-1.14 3.26 1.19.09 2.42-.6 3.19-1.51Z" />
          </svg>
          <span>
            <span className="block text-[10px] leading-4 text-gray-300">{t("downloadOn")}</span>
            <span className="block text-lg font-semibold leading-6">App Store</span>
          </span>
        </a>
      </div>
    </div>
  );
}
