import { initiatePaymentSession, placeOrder, retrieveCart } from "@lib/data/cart"
import { redirect } from "next/navigation"

type Props = {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ id?: string; status?: string; message?: string }>
}

export default async function MoyasarCallbackPage({ params, searchParams }: Props) {
  const { countryCode } = await params
  const { id: moyasarPaymentId, status, message } = await searchParams

  if (!moyasarPaymentId || status !== "paid") {
    const reason = message ? encodeURIComponent(message) : "payment_failed"
    redirect(`/${countryCode}/checkout?step=payment&error=${reason}`)
  }

  const cart = await retrieveCart()
  if (!cart) {
    redirect(`/${countryCode}/cart`)
  }

  // Create/update the Medusa payment session with the verified Moyasar payment ID.
  // The backend will call Moyasar GET /payments/{id} to confirm it's genuinely paid.
  try {
    await initiatePaymentSession(cart, {
      provider_id: "pp_moyasar_moyasar",
      data: { moyasar_id: moyasarPaymentId },
    } as any)
  } catch {
    redirect(`/${countryCode}/checkout?step=payment&error=session_failed`)
  }

  // Place the order — Medusa calls authorizePayment → confirmed → order created → redirect
  await placeOrder()

  // placeOrder redirects internally; this line is only reached on failure
  redirect(`/${countryCode}/checkout?step=payment&error=order_failed`)
}
