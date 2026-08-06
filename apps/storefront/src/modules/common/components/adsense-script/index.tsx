"use client"

import Script from "next/script"
import { usePathname } from "next/navigation"

/** Google AdSense publisher id. Only place it appears. */
export const ADSENSE_CLIENT_ID = "ca-pub-1113985459345993"

/**
 * Paths that must never load the ad script: money and identity pages, where a
 * third-party script has nothing to contribute.
 */
const EXCLUDED = ["/account", "/checkout"]

/**
 * Site-wide AdSense loader.
 *
 * Google's ownership check crawls the home page, so the script cannot stay
 * scoped to /blog — verification fails if it is missing there. This only loads
 * the library; **ad units stay blog-only**. Nothing here places an ad.
 */
const AdsenseScript = () => {
  const pathname = usePathname()

  if (EXCLUDED.some((path) => pathname?.includes(path))) {
    return null
  }

  return (
    <Script
      id="adsbygoogle-init"
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
    />
  )
}

export default AdsenseScript
