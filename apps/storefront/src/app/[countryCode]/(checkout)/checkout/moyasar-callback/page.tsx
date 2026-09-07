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
     * from Moyasar and the SameSite=Strict cart cookie is withheld on it.
     * Unauthenticated by nature — it names a cart, it does not prove one. The
     * backend decides whether this payment may be spent on it; see the note
     * above the retrieveCart call below.
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

  // Kept in step with AUTHORIZED_STATUSES in modules/moyasar/service.ts.
  const POST_CHARGE_STATUSES = ["paid", "captured"]
  const isPostCharge = POST_CHARGE_STATUSES.includes(status ?? "")

  // Every branch below is either before the charge or after it, and the two get
  // different buttons. POST_CHARGE_STATUSES is the line: Moyasar only sends one
  // of these once the money has moved, so nothing past that point may offer
  // "try again" — a second attempt is a second charge. Nothing before it may
  // withhold one.
  //
  // The set must stay in step with AUTHORIZED_STATUSES in the Moyasar provider
  // (modules/moyasar/service.ts), which authorizes on "paid" *or* "captured".
  // This was once the single literal "paid", so a "captured" callback — already
  // charged — fell through to the unknown-status branch and was offered a retry
  // button, which is the one outcome every other branch here was rewritten to
  // prevent.
  //
  // ⚠️ But `status` is a query parameter, so "past the line" is only true for
  // requests that really came from Moyasar. Anyone can type ?status=paid, and
  // since the backend now refuses a payment that was not made for this cart,
  // the post-charge branches are exactly where a forged callback lands. So the
  // copy in them is conditional — "if an amount was charged, do not pay again"
  // — instead of asserting "we received your payment". It reads the same to the
  // buyer it is written for, and stops the page from handing a stranger a
  // sentence saying we took their money, with a reference number of their own
  // choosing, to wave at support.

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

  if (isPostCharge && !paymentId) {
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
        title="لم يكتمل طلبك"
        message="إن كان قد خُصم منك مبلغ فلا تُعد الدفع — تواصل معنا وسنُكمل طلبك يدويًا."
        variant="paid"
      />
    )
  }

  if (!isPostCharge) {
    // A status we do not handle. No status outside POST_CHARGE_STATUSES moves
    // money, so a retry is safe here — and there is no buyer action that fixes
    // it, so the shape is logged. If Moyasar ever adds another status that
    // settles funds, it belongs in that set, not here.
    //
    // This used to read `status !== "paid" || !paymentId`, and the second half
    // could never decide anything: the block above already returns for
    // paid-without-an-id, so by here a post-charge status always has one. The
    // `hasPaymentId` log field went with it — it only ever printed true.
    console.error("[moyasar-callback] unusable callback params", {
      status,
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
  // This cart id is unauthenticated and stays that way: it arrives in a URL
  // anyone can type. It is not treated as a claim of ownership — it only names
  // which cart to try, and the backend decides whether this payment may be
  // spent there.
  //
  // ⚠️ An earlier version of this comment said the backend's payment check
  // "contained" that gap. It did not, and the correction is worth keeping: the
  // amount comparison stops someone paying 1 SAR for a 99 SAR cart, but it says
  // nothing about spending one genuinely-paid payment more than once. Four
  // products here share a price, so a single 69 SAR payment could complete a
  // second, third, fourth cart of the same total — each one a real order with
  // real download links.
  //
  // What actually closes it, both on the backend (2026-09-03):
  //   1. Binding — the browser records the cart on the Moyasar payment
  //      (metadata.cart_id at form init) and the provider compares it against
  //      the cart being completed, which the server derives from the payment
  //      collection rather than believing the request. A payment with no
  //      binding is refused, not waved through.
  //   2. Spending — a unique row per payment id (payment-guard module) means a
  //      payment completes one cart, ever. The same cart re-presenting its own
  //      payment is a retry and still works; a different cart is refused.
  //
  // So a wrong or borrowed cart_id here now fails at the backend rather than
  // producing an order. Keep it that way: do not add a "trusted" cart id to
  // this URL, signed or otherwise — a signature proves the server issued the
  // id, not that this browser owns it (see the SameSite section in CLAUDE.md
  // for why that handoff was built and deleted).
  const cart = await retrieveCart(cartIdFromUrl || undefined)

  if (!cart) {
    // Reached only with a post-charge status, so the buyer has been charged and the
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
        title="لم يكتمل طلبك"
        message="إن كان قد خُصم منك مبلغ فلا تُعد الدفع — تواصل معنا برقم العملية أدناه وسنُكمل طلبك يدويًا."
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
    // Post-charge as well: Moyasar reported a settled status before we got here, so the
    // default "retry" variant would have charged the buyer twice. It carried a
    // cart id too, which is what made that retry link actually work rather than
    // dead-end on a 404 — a working double-charge link is worse than a broken
    // one. Support, with the payment id, is the only correct exit.
    return (
      <CallbackError
        countryCode={countryCode}
        title="لم يكتمل طلبك"
        message="إن كان قد خُصم منك مبلغ فلا تُعد الدفع — تواصل معنا برقم العملية أدناه وسنُكمل طلبك يدويًا."
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
        title="لم يكتمل طلبك"
        message="إن كان قد خُصم منك مبلغ فلا تُعد الدفع — تواصل معنا برقم العملية أدناه وسنُكمل طلبك يدويًا."
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
