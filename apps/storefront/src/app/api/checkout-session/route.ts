import { NextRequest, NextResponse } from "next/server"
import { retrieveCart } from "@lib/data/cart"
import { getCartId } from "@lib/data/cookies"
import { verifyCartHandoff } from "@lib/util/checkout-handoff"

/**
 * Puts a cart id back into the cookie so checkout can rebuild itself.
 *
 * ## Why this exists at all
 *
 * `_medusa_cart_id` is `SameSite=Strict`, so the browser withholds it on any
 * navigation that arrives from another site — which is exactly how a buyer
 * comes back from Moyasar's 3-D Secure page. The callback page already works
 * around that by carrying `cart_id` in the URL; the checkout page had no such
 * route, so landing or refreshing there without the cookie ended in a 404.
 *
 * Strict stays. Relaxing it to Lax would fix the symptom by weakening CSRF
 * protection on the one path that moves money, and this handler gets the same
 * result without touching it.
 *
 * ## Why a route handler and not the page
 *
 * `cookies().set()` throws during a Server Component render. A Route Handler is
 * the only context allowed to write one — the same reason /api/order-complete
 * exists to clear this very cookie.
 *
 * ## Why the id must be signed
 *
 * "An existing cart always wins" is not enough on its own. It stops a crafted
 * link from displacing a live cart, but the victim who matters here has no cart
 * to displace: an attacker builds a cart carrying their own email and products,
 * sends `?cart_id=…` to someone with an empty session, and that person pays for
 * it — while the confirmation mail and the 48-hour signed download links go to
 * the attacker. So the id is only honoured with an HMAC this server minted
 * while rendering that buyer's own checkout page from their own cookie
 * (`lib/util/checkout-handoff`). Recovery, never adoption.
 */

const CART_ID = /^cart_[A-Za-z0-9]+$/
const COUNTRY_CODE = /^[a-z]{2}$/i
const STEPS = new Set(["address", "delivery", "payment"])

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? request.nextUrl.origin

  // Every value below lands in a redirect path, so each is validated rather
  // than interpolated as given.
  const rawCountry = searchParams.get("country_code") ?? ""
  const countryCode = COUNTRY_CODE.test(rawCountry)
    ? rawCountry.toLowerCase()
    : (process.env.NEXT_PUBLIC_DEFAULT_REGION ?? "sa")

  const rawStep = searchParams.get("step") ?? ""
  const step = STEPS.has(rawStep) ? rawStep : "payment"

  const rawCartId = searchParams.get("cart_id") ?? ""
  const cartId = CART_ID.test(rawCartId) ? rawCartId : null
  const handoffToken = searchParams.get("t") ?? undefined

  const toCheckout = new URL(`/${countryCode}/checkout?step=${step}`, baseUrl)
  const toCart = new URL(`/${countryCode}/cart?notice=cart_expired`, baseUrl)
  const toUnavailable = new URL(
    `/${countryCode}/cart?notice=cart_unavailable`,
    baseUrl
  )

  /**
   * Where to send someone when the backend itself is unreachable.
   *
   * Not `toCart` with "your session lapsed" — that is the same lie this whole
   * change exists to remove, and it is the one an earlier version of this
   * handler still told: it redirected to checkout with neither cookie nor
   * cart_id, and checkout then returned null *without any backend call* (there
   * is no id to look up) and bounced to the expired-cart notice.
   *
   * With a cookie in hand, checkout is right: its own lookup will throw and
   * land on the (checkout) error boundary, which shows a traceable digest.
   * Without one there is nothing for checkout to look up, so the buyer gets an
   * outage notice that says the cart is not lost.
   */
  const outageDestination = async () =>
    (await getCartId()) ? toCheckout : toUnavailable

  // Already holding a usable cart — ignore the URL entirely and carry on.
  //
  // throwOnFailure matters here more than anywhere: a null from a backend
  // outage is indistinguishable from "no cart", and "no cart" is the single
  // state in which a URL-supplied id is allowed to be written to the cookie.
  // Collapsing the two would let a transient 500 open the handoff path for a
  // buyer who is holding a perfectly good cart.
  let existing
  try {
    existing = await retrieveCart(undefined, undefined, { throwOnFailure: true })
  } catch (err: any) {
    console.error("[checkout-session] existing cart lookup failed", {
      error: err?.message ?? err,
    })
    return NextResponse.redirect(await outageDestination())
  }

  if (existing && !(existing as any).completed_at) {
    return NextResponse.redirect(toCheckout)
  }

  if (!cartId) {
    return NextResponse.redirect(toCart)
  }

  // Unsigned, expired, or tampered id: refuse it and say nothing about whether
  // that cart exists. Declining costs a buyer one re-entry through the cart;
  // accepting costs them someone else's order.
  if (!verifyCartHandoff(handoffToken, cartId)) {
    console.error("[checkout-session] rejected an unsigned or stale cart id", {
      cartId,
      hasToken: Boolean(handoffToken),
    })
    return NextResponse.redirect(toCart)
  }

  let recovered
  try {
    recovered = await retrieveCart(cartId, undefined, { throwOnFailure: true })
  } catch (err: any) {
    console.error("[checkout-session] cart lookup failed", {
      cartId,
      error: err?.message ?? err,
    })
    return NextResponse.redirect(await outageDestination())
  }

  if (!recovered || (recovered as any).completed_at) {
    console.error("[checkout-session] cart id in url is not usable", {
      cartId,
      completed: Boolean((recovered as any)?.completed_at),
    })
    return NextResponse.redirect(toCart)
  }

  const response = NextResponse.redirect(toCheckout)

  // Same attributes as setCartId in lib/data/cookies — Strict included.
  response.cookies.set("_medusa_cart_id", recovered.id, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })

  return response
}
