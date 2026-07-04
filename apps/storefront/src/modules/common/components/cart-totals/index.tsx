"use client"

import { convertToLocale } from "@lib/util/money"
import React from "react"
import { useLanguage } from "@lib/context/language-context"

type CartTotalsProps = {
  totals: {
    total?: number | null
    subtotal?: number | null
    tax_total?: number | null
    currency_code: string
    item_subtotal?: number | null
    shipping_subtotal?: number | null
    discount_subtotal?: number | null
  }
}

const CartTotals: React.FC<CartTotalsProps> = ({ totals }) => {
  const {
    currency_code,
    total,
    tax_total,
    item_subtotal,
    shipping_subtotal,
    discount_subtotal,
  } = totals

  const { lang } = useLanguage()
  const isAR = lang === "ar"

  return (
    <div>
      <div className="flex flex-col gap-y-2 txt-medium text-ui-fg-subtle ">
        <div className="flex items-center justify-between gap-x-4">
          <span className="min-w-0 flex-1">{isAR ? "المجموع الفرعي" : "Subtotal (excl. shipping and taxes)"}</span>
          <span className="flex-shrink-0 whitespace-nowrap" data-testid="cart-subtotal" data-value={item_subtotal || 0}>
            {convertToLocale({ amount: item_subtotal ?? 0, currency_code })}
          </span>
        </div>
        {!!shipping_subtotal && shipping_subtotal > 0 && (
          <div className="flex items-center justify-between gap-x-4">
            <span className="min-w-0 flex-1">{isAR ? "الشحن" : "Shipping"}</span>
            <span className="flex-shrink-0 whitespace-nowrap" data-testid="cart-shipping" data-value={shipping_subtotal}>
              {convertToLocale({ amount: shipping_subtotal, currency_code })}
            </span>
          </div>
        )}
        {!!discount_subtotal && (
          <div className="flex items-center justify-between gap-x-4">
            <span className="min-w-0 flex-1">{isAR ? "الخصم" : "Discount"}</span>
            <span
              className="flex-shrink-0 whitespace-nowrap text-ui-fg-interactive"
              data-testid="cart-discount"
              data-value={discount_subtotal || 0}
            >
              -{" "}
              {convertToLocale({
                amount: discount_subtotal ?? 0,
                currency_code,
              })}
            </span>
          </div>
        )}
        {!!tax_total && tax_total > 0 && (
          <div className="flex justify-between gap-x-4">
            <span className="min-w-0 flex-1 flex gap-x-1 items-center">{isAR ? "الضريبة" : "Taxes"}</span>
            <span className="flex-shrink-0 whitespace-nowrap" data-testid="cart-taxes" data-value={tax_total}>
              {convertToLocale({ amount: tax_total, currency_code })}
            </span>
          </div>
        )}
      </div>
      <div className="h-px w-full border-b border-white/10 my-4" />
      <div className="flex items-center justify-between gap-x-4 text-ui-fg-base mb-2 txt-medium ">
        <span className="min-w-0 flex-1">{isAR ? "الإجمالي" : "Total"}</span>
        <span
          className="flex-shrink-0 whitespace-nowrap txt-xlarge-plus"
          data-testid="cart-total"
          data-value={total || 0}
        >
          {convertToLocale({ amount: total ?? 0, currency_code })}
        </span>
      </div>
      <div className="h-px w-full border-b border-white/10 mt-4" />
    </div>
  )
}

export default CartTotals
