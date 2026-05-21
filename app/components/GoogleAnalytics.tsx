'use client'
import Script from 'next/script'

export default function GoogleAnalytics({ ga_id }: { ga_id: string }) {
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga_id}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${ga_id}');
        `}
      </Script>
    </>
  )
}