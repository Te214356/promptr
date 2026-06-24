"use client"

import { useLanguage } from "@lib/context/language-context"

export default function StorePageTitle() {
  const { lang } = useLanguage()
  return (
    <h1 data-testid="store-page-title">
      {lang === "ar" ? "جميع المنتجات" : "All products"}
    </h1>
  )
}
