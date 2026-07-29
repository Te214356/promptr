import type { MetadataRoute } from "next"

import { getAllPosts } from "@lib/blog/posts"
import { getBaseURL } from "@lib/util/env"

/**
 * The storefront serves every page under a region prefix, so sitemap entries
 * use the default region rather than the bare path (which only 307-redirects).
 *
 * Store products are deliberately absent: listing them means calling the
 * backend at build time, and a backend hiccup would fail the whole build.
 */
const REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "sa"

const STATIC_ROUTES: { path: string; priority: number }[] = [
  { path: "", priority: 1 },
  { path: "/store", priority: 0.9 },
  { path: "/blog", priority: 0.8 },
  { path: "/terms", priority: 0.3 },
  { path: "/privacy-policy", priority: 0.3 },
  { path: "/refund-policy", priority: 0.3 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getBaseURL()
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(
    ({ path, priority }) => ({
      url: `${base}/${REGION}${path}`,
      lastModified: now,
      changeFrequency: path === "" || path === "/blog" ? "weekly" : "monthly",
      priority,
    })
  )

  const postEntries: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${base}/${REGION}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }))

  return [...staticEntries, ...postEntries]
}
