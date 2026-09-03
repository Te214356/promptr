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
    /**
     * Put here by our own callback_url, because this request arrives cross-site
     * from Moyasar and the SameSite=Strict cart cookie is withheld on it. It is
     * read below without any ownership check — see the warning there.
     */
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
  const {
    id: paymentId,
    status,
    message,
    cart_id: cartIdFromUrl,
  } = await searchParams

  // Every branch below is either before the charge or after it, and the two get
  // different buttons. `status === "paid"` is the line: Moyasar only sends it
  // once the money has moved, so nothing past that point may offer "try again"
  // — a second attempt is a second charge. Nothing before it may withhold one.

  // Not a failure — the buyer pressed cancel on the bank's page.
  if (status === "canceled") {
    return (
      <CallbackError
        countryCode={countryCode}
        message="تم إلغاء عملية الدفع. لم يُخصم أي مبلغ."
      />
    )
  }

  if (status === "failed") {
    const code = classifyPaymentError(message)
    console.error("[moyasar-callback] payment failed", {
      code,
      paymentId,
      cartId: cartIdFromUrl,
      rawMessage: message,
    })
    return (
      <CallbackError
        countryCode={countryCode}
        message={paymentErrorMessage(code, "ar")}
      />
    )
  }

  if (status === "paid" && !paymentId) {
    // Paid, but with no id to quote. The money moved, so this is emphatically
    // not a retry — and we cannot even hand over a reference, which is exactly
    // why it is logged loudly: the payment has to be found from the Moyasar
    // dashboard by time and amount instead.
    console.error("[moyasar-callback] paid callback carried no payment id", {
      cartId: cartIdFromUrl,
      rawMessage: message,
    })
    return (
      <CallbackError
        countryCode={countryCode}
        title="تم استلام دفعتك"
        message="تم استلام دفعتك، لكن تعذّر إكمال الطلب تلقائيًا. لا تُعد الدفع — تواصل معنا وسنُكمل طلبك يدويًا."
        variant="paid"
      />
    )
  }

  if (status !== "paid" || !paymentId) {
    // A status we do not handle. Nothing was charged under any status Moyasar
    // documents other than "paid", so a retry is safe here — and there is no
    // buyer action that fixes it, so the shape is logged.
    console.error("[moyasar-callback] unusable callback params", {
      status,
      hasPaymentId: Boolean(paymentId),
      cartId: cartIdFromUrl,
      rawMessage: message,
    })
    return (
      <CallbackError
        countryCode={countryCode}
        message={paymentErrorMessage("unexpected", "ar")}
      />
    )
  }

  // Retrieve cart: prefer explicit cart_id from URL (this request arrives
  // cross-site from Moyasar, so the Strict cart cookie is withheld), fall back
  // to the _medusa_cart_id cookie.
  //
  // ⚠️ KNOWN GAP, predates this file's current shape and deliberately not
  // patched here: nothing proves the caller owns this cart id. Anyone can call
  //   /checkout/moyasar-callback?status=paid&id=<a payment>&cart_id=<any cart>
  // and drive initiatePaymentSession + completeCart against a cart that is not
  // theirs. What contains it today is entirely on the backend: authorizePayment
  // re-verifies the payment with Moyasar server-side using the secret key, and
  // compares amount and currency against the session (see the amount-guard note
  // in CLAUDE.md), so a mismatched or invented payment is rejected rather than
  // completing an order.
  //
  // Closing it properly means binding the cart id to the buyer's session before
  // they leave for Moyasar — the same binding a signed ?cart_id= handoff would
  // have needed and did not have. That is its own change, not a line here.
  const cart = await retrieveCart(cartIdFromUrl || undefined)

  if (!cart) {
    // Reached only with status "paid", so the buyer has been charged and the
    // cart we were supposed to complete cannot be read — either really gone or
    // a backend that could not be reached. This used to render "session
    // expired" with a link back to the store, which told someone who had just
    // paid that nothing had happened. It is a paid outcome: no retry, and the
    // payment id so support can find the charge.
    console.error("[moyasar-callback] cart lookup returned nothing after payment", {
      paymentId,
      cartId: cartIdFromUrl ?? "(from cookie)",
    })
    return (
      <CallbackError
        countryCode={countryCode}
        title="تم استلام دفعتك"
        message="تم استلام دفعتك، لكن تعذّر الوصول إلى سلتك لإكمال الطلب. لا تُعد الدفع — تواصل معنا وسنُكمل طلبك يدويًا."
        reference={paymentId}
        variant="paid"
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
    // Post-charge as well: Moyasar reported "paid" before we got here, so the
    // default "retry" variant would have charged the buyer twice. It carried a
    // cart id too, which is what made that retry link actually work rather than
    // dead-end on a 404 — a working double-charge link is worse than a broken
    // one. Support, with the payment id, is the only correct exit.
    return (
      <CallbackError
        countryCode={countryCode}
        title="تم استلام دفعتك"
        message="تم استلام دفعتك، لكن تعذّر تجهيز الطلب. لا تُعد الدفع — تواصل معنا وسنُكمل طلبك يدويًا."
        reference={paymentId}
        variant="paid"
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
   * retry — nothing was charged; send the buyer back to the payment step.
   * paid  — money moved; never offer a retry, offer support.
   *
   * There used to be a third, `cart-gone`, for a missing cart. It is gone with
   * its only caller: that branch sits after `status === "paid"`, so "there is
   * no cart, go back to the store" was being shown to someone who had just been
   * charged. Anything that can only happen post-charge is `paid`.
   */
  variant?: "retry" | "paid"
}) {
  const heading = title ?? "فشل الدفع" 

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
          {variant === "retry" && (
            <>
              <LocalizedClientLink
                // No cart id rides along. This link is a same-site click, so the
                // Strict cart cookie is sent with it and checkout finds the cart
                // on its own; a cart id in a URL would only be an id anyone
                // could supply.
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
