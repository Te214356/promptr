/**
 * Google AdSense publisher id — the single place it appears.
 *
 * Two unrelated tags need it and they live in different layouts:
 *   - `app/layout.tsx`            → the ownership-verification <meta>, site-wide
 *   - `(main)/blog/layout.tsx`    → the ad library <script>, blog-only
 * Neither may drift from the other, so the value lives here.
 */
export const ADSENSE_CLIENT_ID = "ca-pub-1113985459345993"

export const ADSENSE_SCRIPT_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`
