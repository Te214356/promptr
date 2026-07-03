"use client"

import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { useLanguage } from "@lib/context/language-context"
import Divider from "@modules/common/components/divider"

type ShippingDetailsProps = {
  order: HttpTypes.StoreOrder
}

const ShippingDetails = ({ order }: ShippingDetailsProps) => {
  const { lang } = useLanguage()
  const isAR = lang === "ar"

  return (
    <div>
      <h2 className="text-2xl font-semibold text-white mb-6">
        {isAR ? "التوصيل" : "Delivery"}
      </h2>
      <div className="flex items-start gap-x-8">
        <div
          className="flex flex-col w-1/3"
          data-testid="shipping-address-summary"
        >
          <span className="text-sm font-semibold text-white/70 mb-1">
            {isAR ? "عنوان الشحن" : "Shipping Address"}
          </span>
          <span className="text-sm text-white/50">
            {order.shipping_address?.first_name}{" "}
            {order.shipping_address?.last_name}
          </span>
          <span className="text-sm text-white/50">
            {order.shipping_address?.address_1}{" "}
            {order.shipping_address?.address_2}
          </span>
          <span className="text-sm text-white/50">
            {order.shipping_address?.postal_code},{" "}
            {order.shipping_address?.city}
          </span>
          <span className="text-sm text-white/50">
            {order.shipping_address?.country_code?.toUpperCase()}
          </span>
        </div>

        <div
          className="flex flex-col w-1/3"
          data-testid="shipping-contact-summary"
        >
          <span className="text-sm font-semibold text-white/70 mb-1">
            {isAR ? "معلومات التواصل" : "Contact"}
          </span>
          <span className="text-sm text-white/50">
            {order.shipping_address?.phone}
          </span>
          <span className="text-sm text-white/50">{order.email}</span>
        </div>

        <div
          className="flex flex-col w-1/3"
          data-testid="shipping-method-summary"
        >
          <span className="text-sm font-semibold text-white/70 mb-1">
            {isAR ? "طريقة التوصيل" : "Method"}
          </span>
          <span className="text-sm text-white/50">
            {(order as any).shipping_methods?.[0]?.name}{" "}
            {order.shipping_methods?.[0]?.total != null && (
              <>
                ({convertToLocale({
                  amount: order.shipping_methods[0].total ?? 0,
                  currency_code: order.currency_code,
                })})
              </>
            )}
          </span>
        </div>
      </div>
      <Divider className="mt-8" />
    </div>
  )
}

export default ShippingDetails
