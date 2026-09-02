import { NextRequest, NextResponse } from "next/server"
import { retrieveCart } from "@lib/data/cart"

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
 * ## Why an existing cart always wins
 *
 * A `cart_id` in a URL is attacker-suppliable. If it could overwrite a live
 * cookie, a crafted link would swap a buyer's cart for someone else's before
 * they paid. So the URL value is only ever used when the visitor has no working
 * cart of their own: recovery, never replacement.
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

  const toCheckout = new URL(`/${countryCode}/checkout?step=${step}`, baseUrl)
  const toCart = new URL(`/${countryCode}/cart?notice=cart_expired`, baseUrl)

  // Already holding a usable cart — ignore the URL entirely and carry on.
  const existing = await retrieveCart()
  if (existing && !(existing as any).completed_at) {
    return NextResponse.redirect(toCheckout)
  }

  if (!cartId) {
    return NextResponse.redirect(toCart)
  }

  let recovered
  try {
    recovered = await retrieveCart(cartId, undefined, { throwOnFailure: true })
  } catch (err: any) {
    // The backend is unreachable, not the cart missing. Sending the buyer to an
    // "expired cart" page here would be the same lie this whole change removes,
    // so bounce them back to checkout and let its error boundary say so.
    console.error("[checkout-session] cart lookup failed", {
      cartId,
      error: err?.message ?? err,
    })
    return NextResponse.redirect(toCheckout)
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
