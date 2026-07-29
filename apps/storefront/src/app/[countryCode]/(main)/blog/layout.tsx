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
      {/* AdSense slot — intentionally empty for now; ads land here, blog-only. */}
      {children}
    </div>
  )
}
