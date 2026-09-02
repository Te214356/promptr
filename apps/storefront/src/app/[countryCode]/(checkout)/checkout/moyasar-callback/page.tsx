import { completeCart, initiatePaymentSession, retrieveCart } from "@lib/data/cart"
import { redirect } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  classifyPaymentError,
  paymentErrorMessage,
} from "@lib/util/payment-errors"

type Props = {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{
    id?: string
    status?: string
    message?: string
    cart_id?: string
  }>
}

/**
 * Where a buyer lands after leaving for Moyasar — including after a 3-D Secure
 * challenge, which is why every 3DS failure surfaces here and not in the form.
 *
 * Nothing Moyasar puts in `message` is shown as-is: it is acquirer text written
 * for us, not for the buyer. It is classified into the same vocabulary the form
 * uses (`lib/util/payment-errors`) and logged raw with console.error.
 */
export default async function MoyasarCallbackPage({ params, searchParams }: Props) {
  const { countryCode } = await params
  const { id: paymentId, status, message, cart_id: cartIdFromUrl } = await searchParams

  // Not a failure — the buyer pressed cancel on the bank's page.
  if (status === "canceled") {
    return <CallbackError countryCode={countryCode} message="تم إلغاء عملية الدفع. لم يُخصم أي مبلغ." />
  }

  if (status === "failed") {
    const code = classifyPaymentError(message)
    console.error("[moyasar-callback] payment failed", {
      code,
      paymentId,
      cartId: cartIdFromUrl,
      rawMessage: message,
    })
    return <CallbackError countryCode={countryCode} message={paymentErrorMessage(code, "ar")} />
  }

  if (status !== "paid" || !paymentId) {
    // Moyasar sent us back with something we do not know how to complete —
    // a status we do not handle, or no payment id at all. There is no buyer
    // action that fixes this, so it reads as unexpected and the shape is logged.
    console.error("[moyasar-callback] unusable callback params", {
      status,
      hasPaymentId: Boolean(paymentId),
      cartId: cartIdFromUrl,
      rawMessage: message,
    })
    return (
      <CallbackError countryCode={countryCode} message={paymentErrorMessage("unexpected", "ar")} />
    )
  }

  // Retrieve cart: prefer explicit cart_id from URL (survives cross-domain cookie loss in
  // Safari Private / strict browsers), fall back to the _medusa_cart_id cookie.
  const cart = await retrieveCart(cartIdFromUrl || undefined)

  if (!cart) {
    // retrieveCart swallows every failure into null, so this is either a cart
    // that really is gone or a backend that could not be reached. Both leave the
    // buyer in the same place — start over — but the log records which id we
    // looked for so the two can be told apart afterwards.
    console.error("[moyasar-callback] cart lookup returned nothing", {
      paymentId,
      cartId: cartIdFromUrl ?? "(from cookie)",
    })
    return (
      <CallbackError
        countryCode={countryCode}
        message={paymentErrorMessage("session_expired", "ar")}
        variant="cart-gone"
      />
    )
  }

  // Create the payment session with moyasar_id — backend verifies the payment server-side
  // via Moyasar API using the secret key (not trusting the URL status param alone).
  try {
    await initiatePaymentSession(cart, {
      provider_id: "pp_moyasar_moyasar",
      data: { moyasar_id: paymentId },
    } as any)
  } catch (err: any) {
    console.error("[moyasar-callback] initiatePaymentSession failed", {
      paymentId,
      cartId: cart.id,
      code: classifyPaymentError(err),
      error: err?.message ?? err,
    })
    return (
      <CallbackError
        countryCode={countryCode}
        message={paymentErrorMessage(classifyPaymentError(err), "ar")}
      />
    )
  }

  // Complete the cart — backend runs authorizePayment which calls Moyasar API again
  const result = await completeCart(cart.id)

  if (!result) {
    // Past this point Moyasar has confirmed the charge, so this branch must
    // never offer "try again": a second attempt is a second charge. It offers
    // support instead, with the payment id the buyer needs to be found.
    console.error("[moyasar-callback] cart completion failed after payment verified", {
      paymentId,
      cartId: cart.id,
    })
    return (
      <CallbackError
        countryCode={countryCode}
        title="تم استلام دفعتك"
        message="تم التحقق من دفعتك بنجاح، لكن تعذّر إنشاء الطلب. لا تُعد الدفع — تواصل معنا وسنُكمل طلبك يدويًا."
        reference={paymentId}
        variant="paid"
      />
    )
  }

  redirect(`/api/order-complete?order_id=${result.orderId}&country_code=${result.countryCode}`)
}

function CallbackError({
  message,
  countryCode,
  title,
  reference,
  variant = "retry",
}: {
  message: string
  countryCode: string
  title?: string
  /** Payment id, shown only so support can find the payment. Not an error code. */
  reference?: string
  /**
   * retry     — nothing was charged; send the buyer back to the payment step.
   * cart-gone — there is no cart to pay for; send them to the store.
   * paid      — money moved; never offer a retry, offer support.
   */
  variant?: "retry" | "cart-gone" | "paid"
}) {
  const heading =
    title ?? (variant === "cart-gone" ? "انتهت الجلسة" : "فشل الدفع")

  return (
    <div className="min-h-screen bg-[#080810] flex flex-col items-center justify-center px-4" dir="rtl">
      <div className="max-w-md w-full bg-white/[0.03] border border-red-500/20 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">{heading}</h1>
        <p className="text-white/60 text-sm mb-6 leading-relaxed">{message}</p>
        {reference && (
          <p className="text-white/40 text-xs mb-8 leading-relaxed">
            رقم العملية للرجوع إليه عند التواصل:{" "}
            <span className="font-mono text-white/70 select-all">{reference}</span>
          </p>
        )}
        <div className={reference ? "flex flex-col gap-3" : "flex flex-col gap-3 mt-2"}>
          {variant === "cart-gone" && (
            <LocalizedClientLink
              href="/"
              className="block w-full py-3 px-6 rounded-lg bg-[#6C2BFF] text-white font-medium hover:bg-[#5a23d4] transition-colors text-center"
            >
              العودة للمتجر
            </LocalizedClientLink>
          )}

          {variant === "retry" && (
            <>
              <LocalizedClientLink
                href="/checkout?step=payment"
                className="block w-full py-3 px-6 rounded-lg bg-[#6C2BFF] text-white font-medium hover:bg-[#5a23d4] transition-colors text-center"
              >
                إعادة المحاولة
              </LocalizedClientLink>
              <LocalizedClientLink
                href="/cart"
                className="block w-full py-3 px-6 rounded-lg border border-white/10 text-white/70 font-medium hover:bg-white/5 transition-colors text-center"
              >
                العودة للسلة
              </LocalizedClientLink>
            </>
          )}

          {variant === "paid" && (
            <>
              <LocalizedClientLink
                href="/contact"
                className="block w-full py-3 px-6 rounded-lg bg-[#6C2BFF] text-white font-medium hover:bg-[#5a23d4] transition-colors text-center"
              >
                تواصل معنا
              </LocalizedClientLink>
              <LocalizedClientLink
                href="/"
                className="block w-full py-3 px-6 rounded-lg border border-white/10 text-white/70 font-medium hover:bg-white/5 transition-colors text-center"
              >
                العودة للمتجر
              </LocalizedClientLink>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
