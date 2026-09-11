import { Metadata } from "next"

import { getBaseURL } from "@lib/util/env"

/**
 * تخطيط لا يرسم شيئًا — وجوده لأجل الميتاداتا وحدها.
 *
 * ⛔ `page.tsx` في هذا المجلد **مكوّن عميل** (`'use client'` لأنه يستعمل
 * `useLanguage`)، ومكوّن العميل **لا يستطيع تصدير `metadata` إطلاقًا** في
 * App Router. فالطريق الوحيد لإعطاء الصفحة canonical وعنوانًا هو تخطيط
 * خادمي مجاور.
 *
 * ⚠️ وكانت الصفحة تُقدَّم **بلا `<title>` البتة** (فُحص على الموقع الحي):
 * التخطيط الجذري لا يضبط عنوانًا، فلم يكن لها ما ترثه.
 */
export async function generateMetadata(props: {
  params: Promise<{ countryCode: string }>
}): Promise<Metadata> {
  const { countryCode } = await props.params

  return {
    title: "اتصل بنا | Promptr",
    description: "تواصل مع Promptr عبر واتساب أو البريد الإلكتروني — دعم ما قبل الشراء وما بعده، ووثيقة عمل حر سعودية موثّقة.",
    alternates: { canonical: `${getBaseURL()}/${countryCode}/contact` },
  }
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
