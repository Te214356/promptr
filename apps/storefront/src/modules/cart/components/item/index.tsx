"use client"

import { updateLineItem } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Spinner from "@modules/common/icons/spinner"
import Thumbnail from "@modules/products/components/thumbnail"
import { useState } from "react"
import ErrorMessage from "@modules/checkout/components/error-message"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem
  type?: "full" | "preview"
  currencyCode: string
}

const Item = ({ item, type = "full", currencyCode }: ItemProps) => {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const maxQuantity = item.variant?.manage_inventory ? 10 : 10

  const changeQuantity = async (quantity: number) => {
    setError(null)
    setUpdating(true)
    await updateLineItem({ lineId: item.id, quantity })
      .catch((err) => setError(err.message))
      .finally(() => setUpdating(false))
  }

  if (type === "preview") {
    return (
      <div className="flex items-center gap-x-3 py-2" data-testid="product-row">
        <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-white/5">
          <Thumbnail thumbnail={item.thumbnail} images={item.variant?.product?.images} size="square" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white truncate" data-testid="product-title">{item.product_title}</p>
          <span className="flex gap-x-1 text-xs text-white/40">
            <span>{item.quantity}×</span>
            <LineItemUnitPrice item={item} style="tight" currencyCode={currencyCode} />
          </span>
        </div>
        <LineItemPrice item={item} style="tight" currencyCode={currencyCode} />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center py-4 border-b border-white/5" data-testid="product-row">
      {/* Product + thumbnail */}
      <div className="flex items-center gap-x-3 min-w-0">
        <LocalizedClientLink href={`/products/${item.product_handle}`} className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-white/5">
          <Thumbnail thumbnail={item.thumbnail} images={item.variant?.product?.images} size="square" />
        </LocalizedClientLink>
        <div className="min-w-0">
          <LocalizedClientLink href={`/products/${item.product_handle}`}>
            <p className="text-sm font-medium text-white truncate" data-testid="product-title">{item.product_title}</p>
          </LocalizedClientLink>
          {item.variant?.title && (
            <p className="text-xs text-white/40 mt-0.5">{item.variant.title}</p>
          )}
          <DeleteButton id={item.id} className="text-xs text-white/30 hover:text-red-400 mt-1" data-testid="product-delete-button" />
          {error && <ErrorMessage error={error} data-testid="product-error-message" />}
        </div>
      </div>

      {/* Quantity selector */}
      <div className="flex items-center gap-x-2 w-24 justify-center">
        <select
          value={item.quantity}
          onChange={(e) => changeQuantity(parseInt(e.target.value))}
          className="bg-white/5 border border-white/10 text-white text-sm rounded-lg px-2 py-1.5 w-14 appearance-none text-center focus:outline-none focus:border-white/30"
          data-testid="product-select-button"
        >
          {Array.from({ length: Math.min(maxQuantity, 10) }, (_, i) => (
            <option value={i + 1} key={i} className="bg-[#0d0d1f]">{i + 1}</option>
          ))}
        </select>
        {updating && <Spinner />}
      </div>

      {/* Unit price */}
      <div className="hidden small:block w-20 text-right">
        <LineItemUnitPrice item={item} style="tight" currencyCode={currencyCode} />
      </div>

      {/* Total price */}
      <div className="w-20 text-right">
        <LineItemPrice item={item} style="tight" currencyCode={currencyCode} />
      </div>
    </div>
  )
}

export default Item
