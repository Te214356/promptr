import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import "styles/globals.css"

/** Google AdSense publisher id. Only place it appears. */
const ADSENSE_CLIENT_ID = "ca-pub-1113985459345993"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  other: {
    // Ownership verification. Two rejections came before this: the script tag
    // alone did not satisfy the check even once it was in the raw HTML.
    // The script below stays — it serves ads, this line proves ownership.
    "google-adsense-account": ADSENSE_CLIENT_ID,
  },
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" data-mode="dark">
      <body className="bg-[#080810] text-white">
        {/*
          A plain <script>, not next/script. Both next/script strategies were
          measured against a real production build and neither put a <script>
          tag in the server-rendered HTML: `afterInteractive` and even
          `beforeInteractive` emit only <link rel="preload" as="script"> and
          inject the tag during hydration. Google's ownership check rejected the
          site twice on that basis, so the raw tag it asked for is what ships.

          React hoists this into <head> and it appears in the initial HTML, so
          a plain `curl` sees it.

          Being in the root layout, it loads on every page — account and
          checkout included. A deliberate, temporary trade to pass
          verification; narrowing the scope again means restoring the
          pathname-guarded client component this replaced.

          Library only: no ad unit is placed anywhere, and when units are added
          they belong in the blog layout alone.
        */}
        <script
          async
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
        />
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
