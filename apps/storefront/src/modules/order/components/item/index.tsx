import { HttpTypes } from "@medusajs/types"

import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import Thumbnail from "@modules/products/components/thumbnail"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  currencyCode: string
}

const Item = ({ item, currencyCode }: ItemProps) => {
  return (
    <div className="flex items-center gap-x-4 w-full">
      <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-white/5">
        <Thumbnail thumbnail={item.thumbnail} size="square" />
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium text-white truncate"
          data-testid="product-name"
        >
          {item.product_title}
        </p>
        {item.variant?.title && (
          <p className="text-xs text-white/40 mt-0.5">{item.variant.title}</p>
        )}
        <p className="text-xs text-white/40 mt-0.5">
          <span data-testid="product-quantity">{item.quantity}</span>×{" "}
          <LineItemUnitPrice item={item} style="tight" currencyCode={currencyCode} />
        </p>
      </div>

      <div className="flex-shrink-0 text-right">
        <LineItemPrice item={item} style="tight" currencyCode={currencyCode} />
      </div>
    </div>
  )
}

export default Item
