import { completeCart, initiatePaymentSession, retrieveCart } from "@lib/data/cart"
import { redirect } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type Props = {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{
    id?: string
    status?: string
    message?: string
    cart_id?: string
  }>
}

export default async function MoyasarCallbackPage({ params, searchParams }: Props) {
  const { countryCode } = await params
  const { id: paymentId, status, message, cart_id: cartIdFromUrl } = await searchParams

  if (status === "canceled") {
    return <CallbackError countryCode={countryCode} message="تم إلغاء عملية الدفع." />
  }

  if (status === "failed") {
    return <CallbackError countryCode={countryCode} message={message || "فشلت عملية الدفع. يرجى المحاولة مرة أخرى."} />
  }

  if (status !== "paid" || !paymentId) {
    return <CallbackError countryCode={countryCode} message="بيانات الدفع غير مكتملة أو غير صالحة." />
  }

  // Retrieve cart: prefer explicit cart_id from URL (survives cross-domain cookie loss in
  // Safari Private / strict browsers), fall back to the _medusa_cart_id cookie.
  const cart = await retrieveCart(cartIdFromUrl || undefined)

  if (!cart) {
    return (
      <CallbackError
        countryCode={countryCode}
        message="انتهت صلاحية الجلسة. يرجى إضافة المنتجات مرة أخرى والمتابعة."
        isCartGone
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
    console.error("[moyasar-callback] initiatePaymentSession failed:", err?.message ?? err)
    return <CallbackError countryCode={countryCode} message="فشل التحقق من الدفع. يرجى التواصل مع الدعم." />
  }

  // Complete the cart — backend runs authorizePayment which calls Moyasar API again
  const result = await completeCart(cart.id)

  if (!result) {
    return <CallbackError countryCode={countryCode} message="تم التحقق من الدفع لكن فشل إنشاء الطلب. يرجى التواصل مع الدعم." />
  }

  redirect(`/${result.countryCode}/order/${result.orderId}/confirmed`)
}

function CallbackError({
  message,
  countryCode,
  isCartGone,
}: {
  message: string
  countryCode: string
  isCartGone?: boolean
}) {
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
        <h1 className="text-2xl font-bold text-white mb-3">
          {isCartGone ? "انتهت الجلسة" : "فشل الدفع"}
        </h1>
        <p className="text-white/60 text-sm mb-8 leading-relaxed">{message}</p>
        <div className="flex flex-col gap-3">
          {isCartGone ? (
            <LocalizedClientLink
              href="/"
              className="block w-full py-3 px-6 rounded-lg bg-[#6C2BFF] text-white font-medium hover:bg-[#5a23d4] transition-colors text-center"
            >
              العودة للمتجر
            </LocalizedClientLink>
          ) : (
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
        </div>
      </div>
    </div>
  )
}
