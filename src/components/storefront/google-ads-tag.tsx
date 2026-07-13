import Script from 'next/script';

// Scoped to a single dealership on purpose — autosdigital.vercel.app hosts
// every dealership's storefront, and this tracking ID belongs to Ivaiporã
// Veículos' own Google Ads account. Rendering it site-wide would count
// visits to every other dealership's store as Ivaiporã's conversions.
const IVAIPORA_SLUG = 'ivaipora-veiculos';
const IVAIPORA_GOOGLE_ADS_ID = 'AW-18316553349';

export function GoogleAdsTag({ dealershipSlug }: { dealershipSlug: string }) {
  if (dealershipSlug !== IVAIPORA_SLUG) return null;

  return (
    <>
      <Script async src={`https://www.googletagmanager.com/gtag/js?id=${IVAIPORA_GOOGLE_ADS_ID}`} strategy="afterInteractive" />
      <Script id="google-ads-tag" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${IVAIPORA_GOOGLE_ADS_ID}');
        `}
      </Script>
    </>
  );
}
