"use client"

import { HttpTypes } from "@medusajs/types"
import { useLanguage } from "@lib/context/language-context"

import Item from "@modules/cart/components/item"

type ItemsTemplateProps = {
  cart?: HttpTypes.StoreCart
}

const ItemsTemplate = ({ cart }: ItemsTemplateProps) => {
  const items = cart?.items
  const { lang } = useLanguage()
  const isAR = lang === "ar"

  return (
    <div className="bg-[#0d0d1f] border border-white/10 rounded-2xl p-5">
      <h2 className="text-xl font-bold text-white mb-4">
        {isAR ? "السلة" : "Cart"}
      </h2>

      {/* Table header */}
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 pb-3 border-b border-white/10 text-xs font-semibold text-white/40 uppercase tracking-wide">
        <span>{isAR ? "المنتج" : "Item"}</span>
        <span className="text-center w-24">{isAR ? "الكمية" : "Quantity"}</span>
        <span className="hidden small:block text-right w-20">{isAR ? "السعر" : "Price"}</span>
        <span className="text-right w-20">{isAR ? "الإجمالي" : "Total"}</span>
      </div>

      <div className="flex flex-col">
        {items
          ? items
              .sort((a, b) => ((a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1))
              .map((item) => (
                <Item
                  key={item.id}
                  item={item}
                  currencyCode={cart?.currency_code ?? "sar"}
                />
              ))
          : null}
      </div>
    </div>
  )
}

export default ItemsTemplate
