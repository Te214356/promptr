"use client"

import Script from "next/script"
import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { useLanguage } from "@lib/context/language-context"
import {
  classifyPaymentError,
  paymentErrorMessage,
  type PaymentErrorCode,
} from "@lib/util/payment-errors"

declare global {
  interface Window {
    Moyasar?: { init: (opts: Record<string, unknown>) => void }
  }
}

type Props = {
  amount: number
  currency: string
  cartId: string
  /**
   * Signed proof, minted server-side, that this cart belongs to this buyer.
   * Rides to Moyasar and back so the return link can restore the SameSite=Strict
   * cart cookie without trusting a raw id from a URL. Null when the signing
   * secret is unset, in which case recovery is simply declined.
   */
  returnToken?: string | null
}

const MPF_CSS = "https://cdn.moyasar.com/mpf/1.14.0/moyasar.css"
const MPF_JS = "https://cdn.moyasar.com/mpf/1.14.0/moyasar.js"

export default function MoyasarForm({
  amount,
  currency,
  cartId,
  returnToken,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)
  const params = useParams()
  const countryCode = (params?.countryCode as string) ?? "sa"
  const { lang } = useLanguage()

  // Two different failures, two different renders — do not merge them.
  //
  //   initError — the form never mounted (bad config, script blocked). Nothing
  //     to preserve, so the box replaces the form and offers a reload.
  //   failure   — a payment attempt was rejected. The form IS mounted and holds
  //     the buyer's typed card data; replacing it would wipe that and force a
  //     full re-entry for a card that only needs one digit corrected. The
  //     message renders *under* the pay button and the form stays exactly where
  //     it is.
  const [initError, setInitError] = useState<string | null>(null)
  const [failure, setFailure] = useState<PaymentErrorCode | null>(null)

  /**
   * Undoes the red pay button.
   *
   * MPF's card component already clears its own `busy` and `disabled` flags on
   * every path that reaches `on_failure`, so the button is clickable again by
   * the time we run — but it also sets a `fail` flag that paints the button red
   * and only clears on a 3-second timer. That red flash with no text is the
   * whole bug: the buyer saw a rejection and no reason. We drop the class as
   * soon as we have a message to show in its place.
   *
   * The form lives outside React's tree by design (see the mount below), so
   * touching its DOM here is not fighting a React render.
   */
  const clearFailStyling = () => {
    hostRef.current
      ?.querySelectorAll(".mysr-form-fail, .mysr-form-busy")
      .forEach((el) => el.classList.remove("mysr-form-fail", "mysr-form-busy"))
  }

  const handleFailure = (raw: unknown) => {
    const code = classifyPaymentError(raw)
    // The raw value stays here and never reaches the buyer: it is acquirer text
    // ("Do not honor"), an MPF internal string, or a Response — all of it either
    // meaningless to them or a hint about our own configuration.
    console.error("[moyasar-form] payment failed", {
      code,
      cartId,
      amount,
      currency,
      raw,
    })
    setFailure(code)
    clearFailStyling()
  }

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
        callback_url:
          `${window.location.origin}/${countryCode}/checkout/moyasar-callback` +
          `?cart_id=${encodeURIComponent(cartId)}` +
          (returnToken ? `&t=${encodeURIComponent(returnToken)}` : ""),
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

        // Fires as the buyer presses pay, before the payment is created. Wiping
        // the previous message here means a second attempt never sits under the
        // reason the first one failed. Returning true is MPF's "proceed with no
        // config changes" — the result is merged through a handler that accepts
        // only callback_url/description/metadata/amount, and {} touches none.
        on_initiating: () => {
          setFailure(null)
          return true
        },

        // The reason MPF's card form is silent. Its failure handler stores the
        // message in component state and fires it here, but the card renderer
        // reads only busy/success/fail/disabled — it never draws the text.
        // (The STC Pay renderer does; cards do not.) This callback is the only
        // way that text reaches the page.
        //
        // Reached by: a decline with no 3-D Secure, a network failure, card data
        // the gateway rejects, and account/config errors. A 3-D Secure failure
        // does NOT arrive here — the buyer has already left for the bank's page
        // by then and comes back through /checkout/moyasar-callback, which
        // classifies it with the same table.
        on_failure: handleFailure,
      })
    } catch (e: any) {
      initialized.current = false
      console.error("[moyasar-form] init failed", { cartId, amount, currency, error: e })
      setInitError(
        lang === "ar"
          ? "تعذّر تحميل بوابة الدفع. أعد تحميل الصفحة وحاول مرة أخرى."
          : "The payment gateway could not be loaded. Reload the page and try again."
      )
    }
  }

  // Fallback: if Moyasar script is already cached, onLoad/onReady won't fire reliably
  useEffect(() => {
    if (!window.Moyasar) return
    const timer = setTimeout(initForm, 100)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (initError) {
    return (
      <div className="mt-6 p-4 text-center border border-red-200 rounded-lg bg-red-50">
        <p className="text-red-600 text-sm">{initError}</p>
        <button
          className="mt-2 underline text-sm text-red-500"
          onClick={() => window.location.reload()}
        >
          {lang === "ar" ? "إعادة المحاولة" : "Try again"}
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

      {failure && (
        <div
          role="alert"
          aria-live="assertive"
          dir={lang === "ar" ? "rtl" : "ltr"}
          className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3"
          data-testid="moyasar-payment-error"
        >
          <p className="text-sm leading-relaxed text-red-300">
            {paymentErrorMessage(failure, lang)}
          </p>
        </div>
      )}
    </>
  )
}
