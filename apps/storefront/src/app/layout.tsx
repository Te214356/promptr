import { getBaseURL } from "@lib/util/env"
import { ADSENSE_CLIENT_ID } from "@lib/util/adsense"
import { Metadata } from "next"
import { Cairo } from "next/font/google"
import "styles/globals.css"

/*
  Cairo is the one Arabic web font on the site, loaded here so every page
  shares it. Until 2026-09-14 it was scoped to the blog and the store loaded
  no web font at all — zero @font-face rules, measured on production — so
  every Arabic string rendered in whatever the visitor's OS shipped.
  `tailwind.config.js` points `font-sans` at the variable this declares.
*/
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  display: "swap",
  variable: "--font-cairo",
})

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
      <body className={`${cairo.variable} font-sans bg-[#080810] text-white`}>
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
