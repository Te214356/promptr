import { Metadata } from "next"
import { HttpTypes } from "@medusajs/types"

import Hero, { type HeroCover } from "@modules/home/components/hero"
import ProductRail from "@modules/home/components/featured-products/product-rail"
import PromoBanners from "@modules/home/components/promo-banners"
import CollectionCards from "@modules/home/components/collection-cards"
import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { getBaseURL } from "@lib/util/env"

/** Eight on the rail; the last three of them also make the hero shelf. */
const HOME_PRODUCT_COUNT = 8

const TITLE = "Promptr — متجرك الرقمي المتكامل"
const DESCRIPTION =
  "منتجات رقمية مختارة للعالم العربي الحديث — Curated digital products for the modern Arab world."

/**
 * ⛔ هذه الصفحة **تُقدَّم بعنوانين بحالة 200**، وهي الوحيدة كذلك: الجذر `/`
 * يُعاد كتابته داخليًا إلى `/${countryCode}` (انظر `middleware.ts`) — قرارٌ
 * اتُّخذ لاجتياز تحقق Google، وتحويله إلى 307 يُبطله.
 *
 * فالـcanonical هو ما يحسم الازدواج. ويشير إلى الصيغة الإقليمية لأنها ما
 * يسمّيه `sitemap.xml` وما تُعلنه بقية الصفحات.
 *
 * ⚠️ وعند إعادة الكتابة يستلم هذا المكوّن `countryCode` الفعلي (المنطقة
 * الافتراضية)، فيخرج `/sa` على العنوانين معًا — وهو المقصود بالضبط.
 */
export async function generateMetadata(props: {
  params: Promise<{ countryCode: string }>
}): Promise<Metadata> {
  const { countryCode } = await props.params

  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: `${getBaseURL()}/${countryCode}` },
  }
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params
  const { countryCode } = params

  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  /*
    One catalogue fetch feeds both the hero shelf and the rail. Cached with
    the catalogue's 60-second revalidate (`CATALOG_REVALIDATE_SECONDS`), so a
    price or cover edited in Admin shows here within a minute, same as the
    store page. A failed fetch degrades to the text hero, never to a 500.
  */
  const products = await listProducts({
    countryCode,
    queryParams: { limit: HOME_PRODUCT_COUNT },
  })
    .then(({ response }) => response.products)
    .catch((e) => {
      console.error("[home] product fetch failed, rendering without the shelf", e)
      return [] as HttpTypes.StoreProduct[]
    })

  // The shelf takes the last three, so the rail's first row shows different products.
  const covers: HeroCover[] = products
    .filter((p) => p.thumbnail)
    .slice(-3)
    .map((p) => ({ src: p.thumbnail as string, title: p.title, handle: p.handle as string }))

  return (
    <div className="bg-[#080810]">
      <Hero covers={covers} />
      <ProductRail products={products} region={region} countryCode={countryCode} />
      <CollectionCards />
      <PromoBanners />
    </div>
  )
}
