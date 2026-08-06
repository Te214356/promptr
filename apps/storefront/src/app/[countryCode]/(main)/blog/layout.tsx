import { Cairo } from "next/font/google"
import Script from "next/script"

/**
 * Cairo is scoped to the blog on purpose — the store, cart and checkout keep
 * their existing typography untouched.
 */
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  display: "swap",
  variable: "--font-cairo",
})

/** Google AdSense publisher id. Only place it appears. */
const ADSENSE_CLIENT_ID = "ca-pub-1113985459345993"

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${cairo.variable} ${cairo.className} bg-promptr-bg`}>
      {/*
        AdSense loads from this layout and nowhere else, so it is scoped to
        /blog — the store, product pages, cart, checkout and account never
        request it. `afterInteractive` keeps it off the critical path.
      */}
      <Script
        id="adsbygoogle-init"
        strategy="afterInteractive"
        crossOrigin="anonymous"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
      />
      {children}
    </div>
  )
}
