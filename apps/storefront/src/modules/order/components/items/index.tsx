import { HttpTypes } from "@medusajs/types"

import Divider from "@modules/common/components/divider"
import Item from "@modules/order/components/item"

type ItemsProps = {
  order: HttpTypes.StoreOrder
}

const Items = ({ order }: ItemsProps) => {
  const items = order.items

  return (
    <div className="flex flex-col gap-y-2">
      <Divider className="!mb-0" />
      {items?.length ? (
        items
          .sort((a, b) => ((a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1))
          .map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-x-4 py-3 border-b border-white/5"
              data-testid="product-row"
            >
              <Item item={item} currencyCode={order.currency_code} />
            </div>
          ))
      ) : null}
    </div>
  )
}

export default Items
