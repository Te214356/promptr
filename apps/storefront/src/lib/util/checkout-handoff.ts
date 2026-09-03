import "server-only"
import { createHmac, timingSafeEqual } from "crypto"

/**
 * Signs the one thing a buyer is allowed to carry back into checkout in a URL:
 * their own cart id.
 *
 * ## Why a signature and not just the id
 *
 * `_medusa_cart_id` is SameSite=Strict, so it does not survive the navigation
 * back from Moyasar's 3-D Secure page, and /api/checkout-session exists to put
 * it back. But a bare `?cart_id=` in a URL is attacker-suppliable: build a cart
 * holding your own email and products, send the link to someone with no cart of
 * their own, and they pay for it while the confirmation mail and the signed
 * download links go to you. Refusing to overwrite an existing cart does not
 * help — the victim in that story has no cart to protect.
 *
 * So the id is only honoured with a signature this server issued, minted at the
 * one moment we know the cart is genuinely the buyer's: while rendering their
 * checkout page, from their own cookie, before they ever leave for Moyasar.
 *
 * ## Shape
 *
 *   <expiry unix seconds>.<base64url HMAC-SHA256(secret, cartId + "." + expiry)>
 *
 * The expiry is inside the signed payload, so it cannot be extended by editing
 * the token. 15 minutes covers a 3-D Secure round trip with room to spare and
 * still puts a hard floor under how long a leaked link is worth anything.
 */

const TTL_SECONDS = 15 * 60

/**
 * Fail closed on a missing secret rather than falling back to an unsigned id.
 * The cost is that cart recovery stops working until the env var is set, which
 * is visible (the buyer lands on the cart with "session lapsed") and recoverable.
 * The alternative — treating "no secret configured" as "skip the check" — would
 * silently reopen the cart-swap path on exactly the deployment that forgot it.
 */
function getSecret(): string | null {
  const secret = process.env.CHECKOUT_SESSION_SECRET
  if (!secret || secret.length < 16) {
    return null
  }
  return secret
}

function computeSignature(secret: string, cartId: string, expiry: number) {
  return createHmac("sha256", secret)
    .update(`${cartId}.${expiry}`)
    .digest("base64url")
}

/** Returns null when no secret is configured — callers must handle that. */
export function signCartHandoff(cartId: string): string | null {
  const secret = getSecret()
  if (!secret || !cartId) {
    return null
  }
  const expiry = Math.floor(Date.now() / 1000) + TTL_SECONDS
  return `${expiry}.${computeSignature(secret, cartId, expiry)}`
}

export function verifyCartHandoff(
  token: string | undefined,
  cartId: string
): boolean {
  const secret = getSecret()
  if (!secret || !token || !cartId) {
    return false
  }

  const separator = token.indexOf(".")
  if (separator <= 0) {
    return false
  }

  const expiry = Number(token.slice(0, separator))
  if (!Number.isInteger(expiry) || expiry < Math.floor(Date.now() / 1000)) {
    return false
  }

  // Uint8Array rather than Buffer: the two are structurally identical here, but
  // timingSafeEqual's typings only accept the former under this @types/node.
  const provided = new Uint8Array(
    Buffer.from(token.slice(separator + 1), "base64url")
  )
  const expected = new Uint8Array(
    Buffer.from(computeSignature(secret, cartId, expiry), "base64url")
  )

  // Length is checked separately because timingSafeEqual throws on a mismatch
  // rather than returning false.
  return (
    provided.length === expected.length && timingSafeEqual(provided, expected)
  )
}
