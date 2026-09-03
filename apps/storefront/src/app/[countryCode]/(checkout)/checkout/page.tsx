import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { listCartShippingMethods } from "@lib/data/fulfillment"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Checkout",
}

const ERROR_MESSAGES: Record<string, string> = {
  payment_failed:
    "فشل الدفع — يرجى التحقق من بيانات البطاقة والمحاولة مرة أخرى. / Payment failed — please check your card details and try again.",
  session_update_failed:
    "خطأ في تهيئة الدفع — يرجى المحاولة مرة أخرى. / Payment initialization error — please try again.",
  order_failed:
    "فشل إنشاء الطلب — يرجى التواصل مع الدعم. / Order creation failed — please contact support.",
}

type Props = {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ step?: string; error?: string }>
}

export default async function Checkout({ params, searchParams }: Props) {
  const { step, error } = await searchParams
  const { countryCode } = await params
  const errorMessage = error
    ? (ERROR_MESSAGES[error] ?? "حدث خطأ في عملية الدفع — يرجى المحاولة مرة أخرى. / A payment error occurred — please try again.")
    : null

  // This page deliberately accepts no cart id from the URL.
  //
  // There was a `?cart_id=` handoff here, on the theory that a buyer returning
  // from Moyasar's 3-D Secure page cannot send the SameSite=Strict cart cookie.
  // That is true of the *callback* request, which arrives cross-site — but the
  // buyer reaches this page by clicking a link on our own callback page, and a
  // Strict cookie is sent on a same-site navigation. Strict withholds the
  // cookie; it never deletes it. So the cookie is back by the time they get
  // here, and the handoff answered a question nobody was asking.
  //
  // What it did do was accept a cart id from a URL, which is attacker-supplied
  // by definition: build a cart with your own email, send someone the link, and
  // they pay for it while the confirmation mail and the download links go to
  // you. Signing the id did not fix that — the signature said "this server
  // issued this id", not "for this browser", and an attacker mints one for
  // their own cart just by loading their own checkout page and reading it.
  //
  // Binding it to the browser is possible, but it buys a recovery path with no
  // demonstrated need. Removed instead.

  // throwOnFailure: this page turns a null cart into a redirect off checkout,
  // so it must not read a backend outage as "the cart is gone". Only a real 404
  // returns null now; anything else raises and lands on the (checkout) error
  // boundary, which shows the buyer an error digest instead of a bare 404.
  const [cart, customer] = await Promise.all([
    retrieveCart(undefined, undefined, { throwOnFailure: true }),
    retrieveCustomer(),
  ])

  // No cart is not a missing page. This used to call notFound(), which told a
  // buyer whose cart session had simply lapsed that the checkout URL did not
  // exist. ?step= and ?error= are deliberately dropped: neither means anything
  // once there is no cart to apply them to.
  if (!cart) {
    redirect(`/${countryCode}/cart?notice=cart_expired`)
  }

  // Safety net: ?step=delivery is a dead end when the cart has no shipping
  // options, because CheckoutForm does not render the Shipping component at
  // all — no section opens and the buyer cannot proceed. Covers every way that
  // URL can be reached, not just the cart button: a bookmark, the back button,
  // or a link written later.
  if (step === "delivery") {
    const shippingMethods = await listCartShippingMethods(cart.id)
    if (!shippingMethods?.length) {
      redirect(
        `/${countryCode}/checkout?step=payment${error ? `&error=${error}` : ""}`
      )
    }
  }

  return (
    <>
      {errorMessage && (
        <div className="content-container pt-6 small:pt-12">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-center">
            <p className="text-red-400 text-sm font-medium">{errorMessage}</p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 small:grid-cols-[1fr_416px] content-container gap-x-40 py-6 small:py-12">
        <PaymentWrapper cart={cart}>
          <CheckoutForm cart={cart} customer={customer} />
        </PaymentWrapper>
        <CheckoutSummary cart={cart} />
      </div>
    </>
  )
}
