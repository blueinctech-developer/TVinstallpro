"use client";

import Script from "next/script";
import { useEffect } from "react";
import type { Tracking } from "@/lib/site-defaults";

/*
 * Google Analytics 4, Google Tag Manager and custom head/footer code (the old site's HFCM plugin),
 * all set in Admin → Settings → Tracking. Only administrators can edit them.
 */
export function TrackingCodes({ t }: { t: Tracking }) {
  // createContextualFragment runs <script> tags, unlike innerHTML.
  useEffect(() => {
    const added: Node[] = [];
    const inject = (html: string, parent: HTMLElement) => {
      if (!html.trim()) return;
      const frag = document.createRange().createContextualFragment(html);
      added.push(...Array.from(frag.childNodes));
      parent.appendChild(frag);
    };
    inject(t.headCode, document.head);
    inject(t.bodyCode, document.body);
    return () => added.forEach((n) => n.parentNode?.removeChild(n));
  }, [t.headCode, t.bodyCode]);

  const ga = /^G-[A-Z0-9]{4,}$/.test(t.ga4Id) ? t.ga4Id : "";
  const gtm = /^GTM-[A-Z0-9]{4,}$/.test(t.gtmId) ? t.gtmId : "";
  return (
    <>
      {ga && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ga}');`}
          </Script>
        </>
      )}
      {gtm && (
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');`}
        </Script>
      )}
    </>
  );
}
