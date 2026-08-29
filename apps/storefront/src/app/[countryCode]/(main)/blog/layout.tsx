import { Cairo } from "next/font/google"

import { ADSENSE_SCRIPT_SRC } from "@lib/util/adsense"

/**
 * Cairo is scoped to the blog on purpose — the store, cart and checkout keep
 * their existing typography untouched.
 */
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  display: "swap",
  variable: "--font-cairo",
})

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${cairo.variable} ${cairo.className} bg-promptr-bg`}>
      {/*
        The AdSense library loads here and nowhere else. It sat in the root
        layout while ownership verification was pending, which meant every page
        — store, cart, checkout, account — pulled a third-party ad script.
        Verification is settled and proven by the <meta> tag in `app/layout.tsx`,
        which is independent of this script and stays site-wide, so the library
        is now scoped to the only tree that will ever carry ad units.

        A plain <script>, not next/script: both next/script strategies were
        measured against a real production build and neither emits a <script>
        tag in the server-rendered HTML — only <link rel="preload"> — injecting
        the real tag during hydration. This is a server component, so React
        hoists the tag into <head> and it ships in the initial HTML.

        Scope is the directory boundary, not a path blocklist: only `page.tsx`
        and `[slug]/` sit under this layout, so a new store route cannot
        silently inherit ads the way the old `/account`+`/checkout` exclusion
        list allowed.

        Library only — no ad unit is placed anywhere yet. When units are added,
        they belong under this layout and nowhere else.
      */}
      <script async crossOrigin="anonymous" src={ADSENSE_SCRIPT_SRC} />
      {children}
    </div>
  )
}
