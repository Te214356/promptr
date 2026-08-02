import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
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
  return <CartTemplate cart={cart} customer={customer} />
}
