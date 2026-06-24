"use client"

import { Heading } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import React from "react"
import { useLanguage } from "@lib/context/language-context"

const Help = () => {
  const { lang } = useLanguage()
  const isAR = lang === "ar"

  return (
    <div className="mt-6">
      <Heading className="text-base-semi">{isAR ? "هل تحتاج مساعدة؟" : "Need help?"}</Heading>
      <div className="text-base-regular my-2">
        <ul className="gap-y-2 flex flex-col">
          <li>
            <LocalizedClientLink href="/contact">
              {isAR ? "تواصل معنا" : "Contact"}
            </LocalizedClientLink>
          </li>
          <li>
            <LocalizedClientLink href="/contact">
              {isAR ? "الاسترجاع والتبادل" : "Returns & Exchanges"}
            </LocalizedClientLink>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default Help
