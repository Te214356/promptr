import { Metadata } from "next"

import FeaturedProducts from "@modules/home/components/featured-products"
import Hero from "@modules/home/components/hero"
import CollectionCards from "@modules/home/components/collection-cards"
import { listCollections } from "@lib/data/collections"
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
  const { collections } = await listCollections({
    fields: "id, handle, title",
  })

  if (!region) {
    return null
  }

  return (
    <div className="bg-[#080810]">
      <Hero />
      <CollectionCards />
      {collections && collections.length > 0 && (
        <div className="py-8 border-t border-white/5">
          <ul className="flex flex-col gap-x-6">
            <FeaturedProducts collections={collections} region={region} />
          </ul>
        </div>
      )}
    </div>
  )
}
