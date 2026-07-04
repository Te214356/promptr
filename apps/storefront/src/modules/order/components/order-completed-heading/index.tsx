"use client"

import { useLanguage } from "@lib/context/language-context"

export function OrderCompletedHeading() {
  const { lang } = useLanguage()
  const isAR = lang === "ar"

  return (
    <div className="flex flex-col gap-y-2 mb-2">
      <h1 className="text-3xl font-bold text-white">
        {isAR ? "شكراً لك!" : "Thank you!"}
      </h1>
      <p className="text-white/70 text-base">
        {isAR ? "تم تأكيد طلبك بنجاح." : "Your order was placed successfully."}
      </p>
    </div>
  )
}

export function OrderSummaryHeading() {
  const { lang } = useLanguage()
  const isAR = lang === "ar"

  return (
    <h2 className="text-xl font-semibold text-white mt-2">
      {isAR ? "ملخص الطلب" : "Order Summary"}
    </h2>
  )
}
