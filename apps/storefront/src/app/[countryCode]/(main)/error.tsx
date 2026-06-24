"use client"

import { useEffect } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-6">
      <h1 className="text-2xl font-semibold text-white">
        حدث خطأ / Something went wrong
      </h1>
      <p className="text-gray-400 max-w-md">
        تعذّر تحميل هذه الصفحة. يرجى المحاولة مجدداً أو العودة للرئيسية.
        <br />
        This page could not be loaded. Please try again or return home.
      </p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="px-6 py-2 bg-[#6C2BFF] text-white rounded hover:opacity-90 transition"
        >
          إعادة المحاولة / Retry
        </button>
        <LocalizedClientLink
          href="/"
          className="px-6 py-2 border border-white/20 text-white rounded hover:border-white/50 transition"
        >
          الرئيسية / Home
        </LocalizedClientLink>
      </div>
    </div>
  )
}
