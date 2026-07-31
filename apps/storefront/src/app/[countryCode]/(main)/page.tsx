import { Metadata } from "next"

import Hero from "@modules/home/components/hero"
import PromoBanners from "@modules/home/components/promo-banners"
import CollectionCards from "@modules/home/components/collection-cards"
import { getRegion } from "@lib/data/regions"

export const metadata: Metadata = {
  title: "Promptr — متجرك الرقمي المتكامل",
  description:
    "منتجات رقمية مختارة للعالم العربي الحديث — Curated digital products for the modern Arab world.",
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

  return (
    <div className="bg-[#080810]">
      <Hero />
      <PromoBanners />
      <CollectionCards />
    </div>
  )
}
