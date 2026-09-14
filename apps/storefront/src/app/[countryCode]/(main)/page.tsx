import { Metadata } from "next"

import Hero from "@modules/home/components/hero"
import ProductRail from "@modules/home/components/featured-products/product-rail"
import PromoBanners from "@modules/home/components/promo-banners"
import CategoryCards from "@modules/home/components/collection-cards"
import { getHomeCatalogue } from "@lib/data/home"
import { getRegion } from "@lib/data/regions"
import { getBaseURL } from "@lib/util/env"

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

  // Rail, hero shelf and category covers are allocated together so no cover
  // appears twice on the page. See `lib/data/home.ts`.
  const { rail, shelf, cards } = await getHomeCatalogue(countryCode)

  return (
    <div className="bg-[#080810]">
      <Hero covers={shelf} />
      <ProductRail products={rail} region={region} countryCode={countryCode} />
      <CategoryCards cards={cards} />
      <PromoBanners />
    </div>
  )
}
