"use client"

import { HttpTypes } from "@medusajs/types"
import { useLanguage } from "@lib/context/language-context"

type OrderDetailsProps = {
  order: HttpTypes.StoreOrder
  showStatus?: boolean
}

const OrderDetails = ({ order, showStatus }: OrderDetailsProps) => {
  const { lang } = useLanguage()
  const isAR = lang === "ar"

  const formatStatus = (str: string) => {
    const formatted = str.split("_").join(" ")
    return formatted.slice(0, 1).toUpperCase() + formatted.slice(1)
  }

  return (
    <div>
      <p className="text-white/60 text-sm">
        {isAR ? "رقم الطلب: " : "Order number: "}
        <span className="text-[#6C2BFF] font-semibold" data-testid="order-id">
          #{order.display_id}
        </span>
      </p>
      <p className="text-white/40 text-xs mt-1" data-testid="order-date">
        {new Date(order.created_at).toLocaleDateString(isAR ? "ar-SA" : "en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      {showStatus && (
        <div className="flex items-center gap-x-4 mt-4">
          <p className="text-white/60 text-sm">
            {isAR ? "حالة الطلب: " : "Order status: "}
            <span className="text-white/80" data-testid="order-status">
              {formatStatus(order.fulfillment_status)}
            </span>
          </p>
          <p className="text-white/60 text-sm">
            {isAR ? "حالة الدفع: " : "Payment status: "}
            <span className="text-white/80" data-testid="order-payment-status">
              {formatStatus(order.payment_status)}
            </span>
          </p>
        </div>
      )}
    </div>
  )
}

export default OrderDetails
