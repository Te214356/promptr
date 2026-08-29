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
          {/*
            This pointed at /contact, so the one link named after the policy
            never reached it. Buyers land here straight after paying, which is
            exactly when the refund terms matter.
          */}
          <li>
            <LocalizedClientLink href="/refund-policy">
              {isAR ? "سياسة الاسترجاع" : "Refund Policy"}
            </LocalizedClientLink>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default Help
