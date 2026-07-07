import { cookies as nextCookies } from "next/headers"

import CartTotals from "@modules/common/components/cart-totals"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OnboardingCta from "@modules/order/components/onboarding-cta"
import OrderDetails from "@modules/order/components/order-details"
import ShippingDetails from "@modules/order/components/shipping-details"
import PaymentDetails from "@modules/order/components/payment-details"
import { OrderCompletedHeading, OrderSummaryHeading } from "@modules/order/components/order-completed-heading"
import DownloadLinks from "@modules/order/components/download-links"
import { getOrderDownloads } from "@lib/data/downloads"
import { HttpTypes } from "@medusajs/types"

type OrderCompletedTemplateProps = {
  order: HttpTypes.StoreOrder
}

export default async function OrderCompletedTemplate({
  order,
}: OrderCompletedTemplateProps) {
  const cookies = await nextCookies()

  const isOnboarding = cookies.get("_medusa_onboarding")?.value === "true"
  const downloads = await getOrderDownloads(order.id)

  return (
    <div className="py-6 min-h-[calc(100vh-64px)] bg-[#080810]" dir="rtl">
      <div className="content-container flex flex-col justify-center items-center gap-y-10 max-w-4xl h-full w-full mx-auto px-4">
        {isOnboarding && <OnboardingCta orderId={order.id} />}
        <div
          className="flex flex-col gap-6 max-w-4xl h-full bg-[#0d0d1f] border border-white/10 rounded-2xl w-full py-10 px-8 text-white"
          data-testid="order-complete-container"
        >
          <OrderCompletedHeading />
          <OrderDetails order={order} />
          <DownloadLinks downloads={downloads} />
          <OrderSummaryHeading />
          <Items order={order} />
          <CartTotals totals={order} />
          <ShippingDetails order={order} />
          <PaymentDetails order={order} />
          <Help />
        </div>
      </div>
    </div>
  )
}
