import { HttpTypes } from "@medusajs/types"

import ProductPreview from "@modules/products/components/product-preview"
import RailHeading from "./rail-heading"

/*
  Eight products with prices, directly under the hero. This component used
  to take a Collection and query by `collection_id`; the store has never had
  a collection (`/store/collections` → count 0), which is why it sat orphaned
  since 2026-07-31. It now renders whatever the page hands it.
*/
export default function ProductRail({
  products,
  region,
  countryCode,
}: {
  products: HttpTypes.StoreProduct[]
  region: HttpTypes.StoreRegion
  countryCode: string
}) {
  if (!products.length) {
    return null
  }

  return (
    <section className="content-container pt-6 pb-16 lg:pb-24">
      <RailHeading />
      <ul className="grid grid-cols-2 small:grid-cols-4 gap-x-6 gap-y-10">
        {products.map((product) => (
          <li key={product.id}>
            <ProductPreview
              product={product}
              region={region}
              countryCode={countryCode}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
