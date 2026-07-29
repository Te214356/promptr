import type { MetadataRoute } from "next"

import { getBaseURL } from "@lib/util/env"

/**
 * Replaces the never-installed `next-sitemap` setup: `next-sitemap.js` sits in
 * the repo but the package is absent and no `postbuild` script runs it, so the
 * site has been serving neither robots.txt nor sitemap.xml.
 */
export default function robots(): MetadataRoute.Robots {
  const base = getBaseURL()

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Checkout and account pages are per-user and must stay out of search.
        disallow: ["/*/checkout", "/*/account", "/*/order", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
