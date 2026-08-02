import { Metadata } from "next"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "404",
  description: "الصفحة غير موجودة",
}

/**
 * Reached only for a genuinely missing cart route now — an empty cart renders
 * the empty state instead of landing here.
 */
export default function NotFound() {
  return (
    <div className="content-container flex flex-col items-center gap-y-6 py-32 text-center">
      <p className="text-5xl font-black text-white/15">404</p>

      <div className="flex flex-col gap-y-3">
        <h1 className="text-2xl font-bold text-white small:text-3xl">
          الصفحة غير موجودة
        </h1>
        <p className="mx-auto max-w-[30rem] text-sm leading-relaxed text-white/50">
          الرابط الذي فتحته غير متاح. يمكنك العودة للرئيسية أو تصفّح المنتجات.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <LocalizedClientLink
          href="/"
          className="rounded-full bg-[#6C2BFF] px-8 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-[#5a22dd] hover:shadow-[0_0_40px_rgba(108,43,255,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00CFFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080810]"
        >
          العودة للرئيسية
        </LocalizedClientLink>
        <LocalizedClientLink
          href="/store"
          className="rounded-full border border-white/15 px-8 py-3 text-sm font-medium text-white/80 transition-all duration-200 hover:border-[#6C2BFF]/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00CFFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080810]"
        >
          تصفّح المتجر
        </LocalizedClientLink>
      </div>
    </div>
  )
}
