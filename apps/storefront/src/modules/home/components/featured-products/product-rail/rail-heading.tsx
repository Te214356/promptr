"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useLanguage } from "@lib/context/language-context"

export default function RailHeading() {
  const { lang } = useLanguage()
  const isAR = lang === "ar"

  return (
    <div className="flex items-baseline justify-between gap-4 mb-8">
      <h2 className="text-2xl sm:text-3xl font-bold text-white">
        {isAR ? "المنتجات" : "Products"}
      </h2>
      <LocalizedClientLink
        href="/store"
        className="text-sm font-medium text-white/60 hover:text-white underline-offset-4 hover:underline transition-colors"
      >
        {isAR ? "عرض الكل" : "View all"}
      </LocalizedClientLink>
    </div>
  )
}
