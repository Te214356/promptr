"use client"

import { Heading } from "@medusajs/ui"
import { useLanguage } from "@lib/context/language-context"

export function OrderCompletedHeading() {
  const { lang } = useLanguage()
  const isAR = lang === "ar"

  return (
    <Heading
      level="h1"
      className="flex flex-col gap-y-3 text-ui-fg-base text-3xl mb-4"
    >
      <span>{isAR ? "شكراً لك!" : "Thank you!"}</span>
      <span>{isAR ? "تم تأكيد طلبك بنجاح." : "Your order was placed successfully."}</span>
    </Heading>
  )
}

export function OrderSummaryHeading() {
  const { lang } = useLanguage()
  const isAR = lang === "ar"

  return (
    <Heading level="h2" className="flex flex-row text-3xl-regular">
      {isAR ? "ملخص الطلب" : "Summary"}
    </Heading>
  )
}
