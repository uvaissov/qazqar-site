"use client";

import { Suspense, useEffect, useRef } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import type { AnalyticsIds } from "@/lib/analytics";

// Счётчики те же, что стояли на старом qazqar.kz, — чтобы не терять историю.
// ID приходят из env (src/lib/analytics.ts); на стейджинге не задаются — ничего не грузим.

declare global {
  interface Window {
    ym?: (id: number, method: string, ...args: unknown[]) => void;
  }
}

/**
 * App Router меняет страницы без перезагрузки: GA4 ловит это сам (enhanced
 * measurement → history changes), а Метрике хит на каждый переход шлём руками.
 * Первый хит отправляет init.
 */
function YandexPageHits({ id }: { id: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prevUrl = useRef<string | null>(null);

  useEffect(() => {
    const url = window.location.href;
    if (prevUrl.current !== null && prevUrl.current !== url) {
      window.ym?.(id, "hit", url, { referer: prevUrl.current });
    }
    prevUrl.current = url;
  }, [id, pathname, searchParams]);

  return null;
}

export default function Analytics({ gtmId, gaId, yandexMetrikaId }: AnalyticsIds) {
  const ymId = yandexMetrikaId ? Number(yandexMetrikaId) : NaN;

  return (
    <>
      {gtmId && (
        <>
          <Script id="gtm" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer',${JSON.stringify(gtmId)});`}
          </Script>
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(gtmId)}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        </>
      )}

      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`}
            strategy="afterInteractive"
          />
          <Script id="gtag-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(gaId)});`}
          </Script>
        </>
      )}

      {Number.isInteger(ymId) && ymId > 0 && (
        <>
          <Script id="yandex-metrika" strategy="afterInteractive">
            {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");ym(${ymId},"init",{defer:false,clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});`}
          </Script>
          <noscript>
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://mc.yandex.ru/watch/${ymId}`}
                style={{ position: "absolute", left: "-9999px" }}
                alt=""
              />
            </div>
          </noscript>
          <Suspense fallback={null}>
            <YandexPageHits id={ymId} />
          </Suspense>
        </>
      )}
    </>
  );
}
