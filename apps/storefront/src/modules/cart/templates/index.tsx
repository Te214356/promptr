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
 *
 * `cart_unavailable` is the backend-outage case, kept separate on purpose. It
 * is the one thing that must never be reported as an expired session: the cart
 * is fine, we just could not reach it, and telling someone their session lapsed
 * invites them to rebuild a cart that still exists.
 *
 * ⚠️ `cart_unavailable` is currently UNEMITTED — nothing in the repo redirects
 * with it (verified by grep across src/: this definition is the only hit). The
 * outage it describes takes a different exit today: checkout's
 * `throwOnFailure` path raises to the (checkout) error boundary instead of
 * redirecting here, and /cart's own loader swallows a failed fetch into `null`,
 * so the buyer sees an empty cart with no notice at all.
 *
 * Kept rather than deleted, deliberately. The distinction it encodes is the
 * part that is expensive to rediscover — we have twice been one wording away
 * from telling someone with a perfectly good cart that their session expired —
 * and the wording is already reviewed and correct. Deleting it would leave the
 * next person to reinvent both the case and the sentence under outage
 * pressure, which is when it will be got wrong.
 *
 * So this is a ready answer without a question yet. Wiring it up (redirecting
 * to /cart?notice=cart_unavailable when the backend is unreachable rather than
 * rendering an unexplained empty cart) is the open item; the string is not.
 */
const NOTICES: Record<string, string> = {
  cart_expired: "انتهت جلسة السلة، الرجاء المحاولة مجدداً.",
  cart_unavailable:
    "تعذّر الوصول إلى الخادم الآن. سلتك لم تُفقد — الرجاء المحاولة بعد قليل.",
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
  // hasOwn, not a bare lookup: `notice` is raw query input, and `NOTICES` is an
  // object literal, so `?notice=constructor` (or toString, valueOf) would walk
  // up to Object.prototype, return a function, and render the notice box with a
  // React "Functions are not valid as a React child" error inside it.
  const noticeMessage =
    notice && Object.hasOwn(NOTICES, notice) ? NOTICES[notice] : null

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
