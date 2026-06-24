"use client"

import { useEffect } from "react"

export default function GlobalError({
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
    <html lang="ar" dir="rtl">
      <body className="bg-[#080810] text-white flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4 p-8">
          <h1 className="text-2xl font-semibold">
            حدث خطأ غير متوقع / An unexpected error occurred
          </h1>
          <p className="text-gray-400">
            يرجى المحاولة مجدداً / Please try again
          </p>
          <button
            onClick={reset}
            className="mt-4 px-6 py-2 bg-[#6C2BFF] text-white rounded hover:opacity-90 transition"
          >
            إعادة المحاولة / Retry
          </button>
        </div>
      </body>
    </html>
  )
}
