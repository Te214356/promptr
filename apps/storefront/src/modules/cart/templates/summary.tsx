"use client"

import { Button, Heading } from "@medusajs/ui"

import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import DiscountCode from "@modules/checkout/components/discount-code"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { useLanguage } from "@lib/context/language-context"

type SummaryProps = {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
  isDigitalOnly?: boolean
}

/**
 * `delivery` is only a real step when the cart actually has shipping options.
 * Every Promptr product is digital, so cart.shipping_methods is always empty
 * and the stock rule below would send every buyer whose cart already carries an
 * address to ?step=delivery — a step CheckoutForm never renders, leaving the
 * page with no open section at all. First-time buyers escaped it only because
 * their cart had no address yet and so went through ?step=address instead.
 */
function getCheckoutStep(cart: HttpTypes.StoreCart, isDigitalOnly: boolean) {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  } else if (!isDigitalOnly && cart?.shipping_methods?.length === 0) {
    return "delivery"
  } else {
    return "payment"
  }
}

const Summary = ({ cart, isDigitalOnly = false }: SummaryProps) => {
  const step = getCheckoutStep(cart, isDigitalOnly)
  const { lang } = useLanguage()
  const isAR = lang === "ar"

  return (
    <div className="flex flex-col gap-y-4">
      <Heading level="h2" className="text-[2rem] leading-[2.75rem]">
        {isAR ? "ملخص الطلب" : "Summary"}
      </Heading>
      <DiscountCode cart={cart} />
      <Divider />
      <CartTotals totals={cart} />
      <LocalizedClientLink
        href={"/checkout?step=" + step}
        data-testid="checkout-button"
      >
        <Button className="w-full h-10">
          {isAR ? "إتمام الشراء" : "Go to checkout"}
        </Button>
      </LocalizedClientLink>
    </div>
  )
}

export default Summary
