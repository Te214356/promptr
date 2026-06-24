import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"

import ProductPreview from "@modules/products/components/product-preview"
import ViewAllLink from "./view-all-link"

export default async function ProductRail({
  collection,
  region,
  countryCode,
}: {
  collection: HttpTypes.StoreCollection
  region: HttpTypes.StoreRegion
  countryCode: string
}) {
  const {
    response: { products: pricedProducts },
  } = await listProducts({
    regionId: region.id,
    queryParams: {
      collection_id: collection.id,
      fields: "*variants.calculated_price",
    },
  })

  if (!pricedProducts) {
    return null
  }

  return (
    <div className="content-container py-12 small:py-24">
      <div className="flex justify-between mb-8 items-center">
        <Text className="txt-xlarge text-white">{collection.title}</Text>
        <ViewAllLink href={`/collections/${collection.handle}`} />
      </div>
      <ul className="grid grid-cols-2 small:grid-cols-3 gap-x-6 gap-y-24 small:gap-y-36">
        {pricedProducts &&
          pricedProducts.map((product) => (
            <li key={product.id}>
              <ProductPreview product={product} region={region} isFeatured countryCode={countryCode} />
            </li>
          ))}
      </ul>
    </div>
  )
}
