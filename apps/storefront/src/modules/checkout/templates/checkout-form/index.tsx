import { signCartHandoff } from "@lib/util/checkout-handoff"
import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { HttpTypes } from "@medusajs/types"
import Addresses from "@modules/checkout/components/addresses"
import Payment from "@modules/checkout/components/payment"
import Shipping from "@modules/checkout/components/shipping"

export default async function CheckoutForm({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) {
  if (!cart) {
    return null
  }

  const shippingMethods = await listCartShippingMethods(cart.id)
  const paymentMethods = await listCartPaymentMethods(cart.region?.id ?? "")

  if (!paymentMethods) {
    return null
  }

  // All Promptr products are digital — skip shipping step when no methods exist
  const isDigitalOnly = !shippingMethods?.length

  // Minted here on purpose: this render is the last point where the cart is
  // known to be the buyer's own, because it was read from their own cookie.
  // The token rides along to Moyasar and back so /api/checkout-session can tell
  // a genuine 3-D Secure return from a crafted ?cart_id= link.
  const returnToken = signCartHandoff(cart.id)

  return (
    <div className="w-full grid grid-cols-1 gap-y-8">
      <Addresses cart={cart} customer={customer} isDigitalOnly={isDigitalOnly} />

      {!isDigitalOnly && (
        <Shipping cart={cart} availableShippingMethods={shippingMethods} />
      )}

      {/*
        No Review step. Payment completes inside the Moyasar form and returns
        through /checkout/moyasar-callback, so the flow is address → payment and
        nothing ever navigated to ?step=review. The Review component rendered an
        empty heading on every checkout and its consent copy never reached a
        buyer; that copy now sits above the card fields in Payment.
      */}
      <Payment
        cart={cart}
        availablePaymentMethods={paymentMethods}
        returnToken={returnToken}
      />
    </div>
  )
}
