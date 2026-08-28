import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { listCartShippingMethods } from "@lib/data/fulfillment"
import CartTemplate from "@modules/cart/templates"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cart",
  description: "View your cart",
}

export default async function Cart() {
  const [cart, customer] = await Promise.all([
    retrieveCart().catch((error) => {
      console.error(error)
      return null
    }),
    retrieveCustomer(),
  ])

  // Having no cart is the normal state for anyone who has not added a product
  // yet, and CartTemplate already renders the empty state for it. This used to
  // call notFound(), which showed a 404 to every first-time visitor who opened
  // the cart from the menu.
  // Same source of truth CheckoutForm uses to decide whether a delivery step
  // exists at all, so the checkout button cannot point at a step the checkout
  // page will not render. listCartShippingMethods returns null on failure,
  // which reads as digital-only here exactly as it does in CheckoutForm.
  const shippingMethods = cart ? await listCartShippingMethods(cart.id) : null
  const isDigitalOnly = !shippingMethods?.length

  return (
    <CartTemplate
      cart={cart}
      customer={customer}
      isDigitalOnly={isDigitalOnly}
    />
  )
}
