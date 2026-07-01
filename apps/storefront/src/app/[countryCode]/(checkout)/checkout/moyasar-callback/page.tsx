import { initiatePaymentSession, placeOrder, retrieveCart } from "@lib/data/cart"
import { redirect } from "next/navigation"

type Props = {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ id?: string; status?: string; message?: string }>
}

export default async function MoyasarCallbackPage({ params, searchParams }: Props) {
  const { countryCode } = await params
  const { id: paymentId, status, message } = await searchParams

  if (status === "failed") {
    const reason = message ? encodeURIComponent(message) : "payment_failed"
    redirect(`/${countryCode}/checkout?step=payment&error=${reason}`)
  }

  if (status === "canceled" || !paymentId) {
    redirect(`/${countryCode}/checkout?step=payment`)
  }

  if (status !== "paid") {
    redirect(`/${countryCode}/checkout?step=payment&error=payment_failed`)
  }

  const cart = await retrieveCart()
  if (!cart) {
    redirect(`/${countryCode}/cart`)
  }

  // Update the payment session with the verified Moyasar payment ID.
  // The backend initiatePayment calls Moyasar GET /payments/{id} to confirm it's genuinely paid.
  try {
    await initiatePaymentSession(cart, {
      provider_id: "pp_moyasar_moyasar",
      data: { moyasar_id: paymentId },
    } as any)
  } catch {
    redirect(`/${countryCode}/checkout?step=payment&error=payment_failed`)
  }

  // Complete the cart — backend calls authorizePayment → Moyasar verification → order created.
  // placeOrder redirects internally to /order/{id}/confirmed on success.
  await placeOrder()

  // Only reached if cart wasn't converted to an order (payment not yet authorized).
  redirect(`/${countryCode}/checkout?step=payment&error=order_failed`)
}
