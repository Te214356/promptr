"use client"

import Script from "next/script"
import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"

declare global {
  interface Window {
    Moyasar?: { init: (opts: Record<string, unknown>) => void }
  }
}

type Props = { amount: number; currency: string; cartId: string }

const MPF_CSS = "https://cdn.moyasar.com/mpf/1.14.0/moyasar.css"
const MPF_JS = "https://cdn.moyasar.com/mpf/1.14.0/moyasar.js"

export default function MoyasarForm({ amount, currency, cartId }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)
  const params = useParams()
  const countryCode = (params?.countryCode as string) ?? "sa"
  const [error, setError] = useState<string | null>(null)

  // Called by next/script onLoad + onReady (handles both first load and cached script)
  const initForm = () => {
    if (initialized.current || !hostRef.current || !window.Moyasar) return
    initialized.current = true

    try {
      // Create a fresh div that Moyasar owns — never touched by React's virtual DOM
      const mount = document.createElement("div")
      mount.className = "mysr-form"
      hostRef.current.replaceChildren(mount)

      window.Moyasar.init({
        element: ".mysr-form",
        amount: Math.round(amount),
        currency: currency.toUpperCase(),
        description: "Promptr Order",
        publishable_api_key: process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY ?? "",
        callback_url: `${window.location.origin}/${countryCode}/checkout/moyasar-callback?cart_id=${cartId}`,
        methods: ["creditcard"],
        supported_networks: ["visa", "mastercard", "mada"],
      })
    } catch (e: any) {
      initialized.current = false
      setError(e?.message ?? "خطأ في تهيئة بوابة الدفع.")
    }
  }

  // Fallback: if Moyasar script is already cached, onLoad/onReady won't fire reliably
  useEffect(() => {
    if (!window.Moyasar) return
    const timer = setTimeout(initForm, 100)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (error) {
    return (
      <div className="mt-6 p-4 text-center border border-red-200 rounded-lg bg-red-50">
        <p className="text-red-600 text-sm">{error}</p>
        <button
          className="mt-2 underline text-sm text-red-500"
          onClick={() => window.location.reload()}
        >
          إعادة المحاولة
        </button>
      </div>
    )
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href={MPF_CSS} />
      <Script
        src={MPF_JS}
        strategy="afterInteractive"
        onLoad={initForm}
        onReady={initForm}
      />
      <div className="mt-6 border border-white/10 rounded-lg p-4 bg-white min-h-[200px]">
        <div ref={hostRef} />
      </div>
    </>
  )
}
