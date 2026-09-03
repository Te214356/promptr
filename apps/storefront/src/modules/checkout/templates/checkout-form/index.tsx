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
      <Payment cart={cart} availablePaymentMethods={paymentMethods} />
    </div>
  )
}
