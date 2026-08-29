import { getBaseURL } from "@lib/util/env"
import { ADSENSE_CLIENT_ID } from "@lib/util/adsense"
import { Metadata } from "next"
import "styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  other: {
    /*
      AdSense ownership verification — site-wide on purpose, and it must stay
      that way. Google verifies the exact address it was given, and the crawler
      reaches the home page, not /blog. Two earlier attempts were rejected while
      only the <script> tag was present, so this meta line is what actually
      proves ownership; scoping it or removing it undoes the verification.

      The ad library <script> used to sit beside it here, which loaded it on
      every page including cart, checkout and account. It now lives in
      `(main)/blog/layout.tsx` alone — the two tags are independent.
    */
    "google-adsense-account": ADSENSE_CLIENT_ID,
  },
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" data-mode="dark">
      <body className="bg-[#080810] text-white">
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
