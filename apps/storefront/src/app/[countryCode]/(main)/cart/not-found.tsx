"use client"

import { ArrowUpRightMini } from "@medusajs/icons"
import { Text } from "@medusajs/ui"
import Link from "next/link"
import { useLanguage } from "@lib/context/language-context"

export default function NotFound() {
  const { lang } = useLanguage()
  const isAR = lang === "ar"

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
      <h1 className="text-2xl-semi text-ui-fg-base">
        {isAR ? "الصفحة غير موجودة" : "Page not found"}
      </h1>
      <p className="text-small-regular text-ui-fg-base">
        {isAR
          ? "السلة التي تحاول الوصول إليها غير موجودة. امسح الكوكيز وحاول مجدداً."
          : "The cart you tried to access does not exist. Clear your cookies and try again."}
      </p>
      <Link className="flex gap-x-1 items-center group" href="/">
        <Text className="text-ui-fg-interactive">
          {isAR ? "العودة للرئيسية" : "Go to frontpage"}
        </Text>
        <ArrowUpRightMini
          className="group-hover:rotate-45 ease-in-out duration-150"
          color="var(--fg-interactive)"
        />
      </Link>
    </div>
  )
}
