"use client"

import { useLanguage } from "@lib/context/language-context"

/**
 * The heading is the only bilingual piece of an otherwise server-rendered
 * section, so it lives in its own client component — the same pattern as
 * `store/templates/store-page-title.tsx`. It used to print both languages in
 * one line ("قد يعجبك أيضاً / You might also want to…").
 */
export default function RelatedProductsHeading() {
  const { lang } = useLanguage()
  const isAR = lang === "ar"

  return (
    <div className="flex items-baseline justify-between gap-4 mb-8">
      <h2 className="text-2xl font-bold text-white">
        {isAR ? "قد يعجبك أيضًا" : "You might also like"}
      </h2>
      <span className="text-sm text-white/50">
        {isAR ? "منتجات ذات صلة" : "Related products"}
      </span>
    </div>
  )
}
