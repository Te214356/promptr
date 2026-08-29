"use client"

import Script from "next/script"
import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { useLanguage } from "@lib/context/language-context"

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
  const { lang } = useLanguage()
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
        // ⛔ Raw pass-through — never scale this. `amount` is cart.total in the
        // minor unit, which is exactly what Moyasar expects, and convertToLocale
        // divides by 100 for display, so what is charged == what was shown.
        // Multiplying by 100 here makes the backend amount check reject every
        // payment (see authorizePayment in the moyasar provider service).
        amount: Math.round(amount),
        currency: currency.toUpperCase(),
        description: "Promptr Order",
        publishable_api_key: process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY ?? "",
        callback_url: `${window.location.origin}/${countryCode}/checkout/moyasar-callback?cart_id=${cartId}`,
        methods: ["creditcard"],
        supported_networks: ["visa", "mastercard", "mada"],
        // Passed explicitly rather than left to inference. Moyasar's documented
        // default is "inferred from the <html> element, then fall back to en" —
        // and LanguageProvider writes document.documentElement.lang on mount
        // from localStorage, so the attribute Moyasar reads is whatever the
        // visitor last picked. A visitor who once chose English kept getting an
        // English form even with the rest of the page in Arabic, and the value
        // depended on whether that write landed before Moyasar initialised.
        //
        // Driven by the same `lang` as every other string in checkout, so the
        // form matches the page instead of being pinned to one language.
        // Read once at init: switching language after the form has mounted does
        // not re-render it (`initialized` guard), which is deliberate — tearing
        // down a mounted payment form mid-entry would clear typed card data.
        language: lang,
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
