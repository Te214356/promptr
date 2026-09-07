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

  /*
    Every Promptr product is digital (a PDF delivered by email), so this is
    normally true for every cart. Derive it from the line items' own
    requires_shipping flag — the exact field Medusa's completeCart validates
    against (core-flows validate-shipping: items requiring shipping + zero
    shipping methods ⟶ 400) — so the storefront and the backend cannot
    disagree about what "digital" means.

    It was previously inferred from the *absence* of shipping options, which is
    a different question with a different answer. A cart whose items required
    shipping while the store had no options configured read as "digital" here,
    skipped the shipping step, reached Moyasar, took the money, and was then
    refused by completeCart. Measured on a real local purchase: the buyer was
    charged and no order existed. Never infer this from shipping options again.

    If an item ever does require shipping, the Shipping step renders instead —
    the buyer may find it empty and be stuck, but stuck before paying beats
    charged and refused after.
  */
  const isDigitalOnly = !cart.items?.some((item) => item.requires_shipping)

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
