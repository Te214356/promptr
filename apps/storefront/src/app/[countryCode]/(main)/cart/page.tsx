import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import CartTemplate from "@modules/cart/templates"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cart",
  description: "View your cart",
}

type Props = {
  searchParams: Promise<{ notice?: string }>
}

export default async function Cart({ searchParams }: Props) {
  const { notice } = await searchParams

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
  // Same source of truth CheckoutForm and the checkout page use, so the
  // checkout button cannot point at a step the checkout page will not render.
  // It must stay the line items' own requires_shipping — the field Medusa's
  // completeCart validates against. Inferring it from shipping options instead
  // sent a returning buyer with a saved address straight to the payment step
  // on a shipping-requiring cart, which takes the money and is then refused.
  const isDigitalOnly = !cart?.items?.some((item) => item.requires_shipping)

  return (
    <CartTemplate
      cart={cart}
      customer={customer}
      isDigitalOnly={isDigitalOnly}
      notice={notice}
    />
  )
}
