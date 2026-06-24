"use client"

import InteractiveLink from "@modules/common/components/interactive-link"
import { useLanguage } from "@lib/context/language-context"

export default function ViewAllLink({ href }: { href: string }) {
  const { lang } = useLanguage()
  return (
    <InteractiveLink href={href}>
      {lang === "ar" ? "عرض الكل" : "View all"}
    </InteractiveLink>
  )
}
