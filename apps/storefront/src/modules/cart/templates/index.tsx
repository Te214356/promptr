import ItemsTemplate from "./items"
import Summary from "./summary"
import EmptyCartMessage from "../components/empty-cart-message"
import SignInPrompt from "../components/sign-in-prompt"
import Divider from "@modules/common/components/divider"
import { HttpTypes } from "@medusajs/types"

/**
 * Notices the checkout flow can hand back.
 *
 * `cart_expired` is shown when checkout found no cart. The wording says the
 * cart session lapsed and nothing more: a buyer who was mid-payment must not
 * read it as "your money is gone", so it makes no claim about a payment either
 * way and does not use the word "failed".
 */
const NOTICES: Record<string, string> = {
  cart_expired: "انتهت جلسة السلة، الرجاء المحاولة مجدداً.",
}

const CartTemplate = ({
  cart,
  customer,
  isDigitalOnly = false,
  notice,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
  isDigitalOnly?: boolean
  notice?: string
}) => {
  const noticeMessage = notice ? NOTICES[notice] : null

  return (
    <div className="py-8">
      <div className="content-container" data-testid="cart-container">
        {noticeMessage && (
          <div
            role="status"
            dir="rtl"
            className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3"
            data-testid="cart-notice"
          >
            <p className="text-sm text-amber-200">{noticeMessage}</p>
          </div>
        )}
        {cart?.items?.length ? (
          <div className="grid grid-cols-1 small:grid-cols-[1fr_360px] gap-x-8">
            <div className="flex flex-col py-4 gap-y-4">
              {!customer && (
                <>
                  <SignInPrompt />
                  <Divider />
                </>
              )}
              <ItemsTemplate cart={cart} />
            </div>
            <div className="relative">
              <div className="flex flex-col gap-y-6 sticky top-12">
                {cart && cart.region && (
                  <div className="bg-[#0d0d1f] border border-white/10 rounded-2xl py-6 px-5">
                    <Summary cart={cart as any} isDigitalOnly={isDigitalOnly} />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <EmptyCartMessage />
          </div>
        )}
      </div>
    </div>
  )
}

export default CartTemplate
