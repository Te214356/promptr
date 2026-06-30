"use client"

import { useEffect, useRef } from "react"
import { useParams } from "next/navigation"

declare global {
  interface Window {
    Moyasar?: {
      init: (options: Record<string, unknown>) => void
    }
  }
}

type MoyasarFormProps = {
  amount: number
  currency: string
}

export default function MoyasarForm({ amount, currency }: MoyasarFormProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const params = useParams()
  const countryCode = (params?.countryCode as string) ?? "sa"
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    // Load Moyasar CSS
    if (!document.querySelector('link[href*="cdn.moyasar.com"]')) {
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = "https://cdn.moyasar.com/mpf/1.14.0/main.css"
      document.head.appendChild(link)
    }

    const callbackUrl = `${window.location.origin}/${countryCode}/checkout/moyasar-callback`

    const initMoyasar = () => {
      if (!window.Moyasar || !containerRef.current) return
      containerRef.current.innerHTML = ""
      window.Moyasar.init({
        element: containerRef.current,
        amount: Math.round(amount), // already in halalas from Medusa
        currency: currency.toUpperCase(),
        description: "طلب Promptr / Promptr Order",
        publishable_api_key: process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY ?? "",
        callback_url: callbackUrl,
        methods: ["creditcard"],
      })
    }

    if (window.Moyasar) {
      initMoyasar()
    } else if (!document.querySelector('script[src*="cdn.moyasar.com"]')) {
      const script = document.createElement("script")
      script.src = "https://cdn.moyasar.com/mpf/1.14.0/moyasar.js"
      script.onload = initMoyasar
      document.body.appendChild(script)
    } else {
      // Script tag exists but Moyasar not ready yet — wait
      const interval = setInterval(() => {
        if (window.Moyasar) {
          clearInterval(interval)
          initMoyasar()
        }
      }, 100)
    }
  }, [amount, currency, countryCode])

  return (
    <div className="mt-6 border border-gray-200 rounded-lg p-4 bg-white">
      <div ref={containerRef} />
    </div>
  )
}
