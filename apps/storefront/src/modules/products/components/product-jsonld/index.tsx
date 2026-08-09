import { HttpTypes } from "@medusajs/types"

import { toPlainText } from "@lib/util/plain-text"

type ProductJsonLdProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  /** Site origin, e.g. https://promptrsa.com */
  baseUrl: string
}

/**
 * Medusa returns money in the minor unit. Measured, not assumed: the store API
 * returns calculated_amount 4900 for the CV guide and the page renders
 * "SAR 49.00" for the same variant. schema.org expects the major unit.
 */
const toMajorUnit = (minor: number): string => (minor / 100).toFixed(2)

const absolute = (url: string, baseUrl: string): string =>
  url.startsWith("http") ? url : `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`

/**
 * schema.org `Product` markup for a store page.
 *
 * Rendered from a server component so it appears in the server-rendered HTML —
 * a crawler that never runs JavaScript still sees it.
 *
 * Nothing here is invented: no rating, no review, no availability we cannot
 * back. Every value comes from Medusa or from a policy page that says it.
 */
const ProductJsonLd = ({ product, region, countryCode, baseUrl }: ProductJsonLdProps) => {
  const variants = product.variants ?? []

  const prices = variants
    .map((v) => v.calculated_price?.calculated_amount)
    .filter((amount): amount is number => typeof amount === "number")

  // A Product without an Offer is worse than no markup at all.
  if (!prices.length) {
    return null
  }

  const url = `${baseUrl}/${countryCode}/products/${product.handle}`

  const images = [
    ...(product.thumbnail ? [product.thumbnail] : []),
    ...(product.images?.map((i) => i.url) ?? []),
  ]
    .filter((src): src is string => Boolean(src))
    .map((src) => absolute(src, baseUrl))
    .filter((src, i, all) => all.indexOf(src) === i)

  const currency = (
    variants[0]?.calculated_price?.currency_code ??
    region.currency_code ??
    "sar"
  ).toUpperCase()

  const offerBase = {
    url,
    priceCurrency: currency,
    // Digital downloads with manage_inventory disabled: never out of stock.
    availability: "https://schema.org/InStock",
    itemCondition: "https://schema.org/NewCondition",
    category: "Digital Goods",
    seller: { "@type": "Organization", name: "Promptr" },
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      applicableCountry: "SA",
      // The published policy states plainly that once a digital product is
      // delivered it cannot be returned or refunded. The four refund cases it
      // does allow are remedies for a defect (corrupt file, material mismatch,
      // duplicate charge, non-delivery) — not returns by choice. schema.org has
      // no category for "refund on defect only", and claiming a return window
      // would promise more than the page does, so the narrower value is used
      // and the link carries the reader to the exceptions.
      returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
      merchantReturnLink: `${baseUrl}/${countryCode}/refund-policy`,
    },
  }

  const low = Math.min(...prices)
  const high = Math.max(...prices)

  // Today every product has a single variant at a single price. If that ever
  // changes, one variant's price must not be published as the product's price.
  const offers =
    low === high
      ? { "@type": "Offer", price: toMajorUnit(low), ...offerBase }
      : {
          "@type": "AggregateOffer",
          lowPrice: toMajorUnit(low),
          highPrice: toMajorUnit(high),
          offerCount: prices.length,
          ...offerBase,
        }

  const description = toPlainText(product.description)

  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    ...(description ? { description } : {}),
    // No variant carries a SKU yet, so the handle stands in: stable, unique and
    // verifiable. Real SKUs entered in Admin are picked up automatically.
    sku: variants[0]?.sku ?? product.handle,
    ...(images.length ? { image: images } : {}),
    brand: { "@type": "Brand", name: "Promptr" },
    offers,
  }

  return (
    <script
      type="application/ld+json"
      // Values come from our own catalogue; `<` is escaped so a stray character
      // cannot close the script tag early.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  )
}

export default ProductJsonLd
