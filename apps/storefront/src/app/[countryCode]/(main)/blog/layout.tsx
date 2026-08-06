import { Cairo } from "next/font/google"

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
        The AdSense library now loads site-wide from the (main) layout, because
        Google's ownership check crawls the home page. Ad units, when they are
        added, still belong here and only here — the store and checkout stay
        ad-free.
      */}
      {children}
    </div>
  )
}
