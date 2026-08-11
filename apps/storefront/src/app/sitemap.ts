import type { MetadataRoute } from "next"

import { getAllPosts } from "@lib/blog/posts"
import { getBaseURL } from "@lib/util/env"

/**
 * The storefront serves every page under a region prefix, so sitemap entries
 * use the default region rather than the bare path (which only 307-redirects).
 *
 * Product pages are included. They used to be left out to keep the backend off
 * the build path, but the cost showed up in Search Console: with no product URL
 * in the sitemap, discovery relied on internal links alone and three products
 * were never indexed at all. They are fetched defensively instead — see
 * fetchProducts below.
 *
 * Category pages are still absent, pending their rename and re-assignment in
 * Admin.
 */
const REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "sa"

/**
 * Regenerated hourly rather than frozen at build time. Products are fetched
 * from the backend, and a build-time snapshot would mean a single backend
 * hiccup ships a product-less sitemap that stays wrong until the next deploy.
 * With ISR the next revalidation heals it on its own.
 */
export const revalidate = 3600

const PRODUCT_FETCH_TIMEOUT_MS = 8000

const STATIC_ROUTES: { path: string; priority: number }[] = [
  { path: "", priority: 1 },
  { path: "/store", priority: 0.9 },
  { path: "/blog", priority: 0.8 },
  { path: "/about", priority: 0.5 },
  { path: "/contact", priority: 0.5 },
  { path: "/terms", priority: 0.3 },
  { path: "/privacy-policy", priority: 0.3 },
  { path: "/refund-policy", priority: 0.3 },
]

type SitemapProduct = { handle: string; updated_at?: string }

/**
 * Deliberately a plain fetch rather than `listProducts`: that helper reads
 * cookies for auth headers, which opts the route out of static generation
 * entirely. Nothing here is per-visitor, so the publishable key is enough.
 *
 * Never throws — the sitemap must render even when the backend does not
 * answer.
 */
async function fetchProducts(): Promise<SitemapProduct[]> {
  const backend = process.env.MEDUSA_BACKEND_URL
  const key = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

  if (!backend || !key) {
    console.error("[sitemap] missing MEDUSA_BACKEND_URL or publishable key — products omitted")
    return []
  }

  try {
    const res = await fetch(
      `${backend}/store/products?limit=100&fields=handle,updated_at`,
      {
        headers: { "x-publishable-api-key": key },
        signal: AbortSignal.timeout(PRODUCT_FETCH_TIMEOUT_MS),
        next: { revalidate },
      }
    )

    if (!res.ok) {
      console.error(`[sitemap] product fetch failed: HTTP ${res.status} — products omitted`)
      return []
    }

    const { products } = (await res.json()) as { products?: SitemapProduct[] }

    // A well-formed response with an empty list is treated as a failure, not as
    // "the catalogue is empty": the store has never had zero products, so this
    // is far more likely a filter, key or permission problem. Shipping a
    // product-less sitemap silently is the outcome worth avoiding.
    if (!products?.length) {
      console.error("[sitemap] product fetch returned zero products — treating as failure")
      return []
    }

    return products.filter((p) => p.handle)
  } catch (error) {
    console.error(
      `[sitemap] product fetch threw: ${
        error instanceof Error ? error.message : String(error)
      } — products omitted`
    )
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  const products = await fetchProducts()

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${base}/${REGION}/products/${product.handle}`,
    lastModified: product.updated_at ? new Date(product.updated_at) : now,
    changeFrequency: "weekly",
    priority: 0.9,
  }))

  // Category pages are intentionally absent for now: they are about to be
  // renamed and re-assigned in Admin.
  return [...staticEntries, ...postEntries, ...productEntries]
}
