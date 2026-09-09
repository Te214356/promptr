"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import {
  getAuthHeaders,
  getCacheOptions,
  getCacheTag,
  getCartId,
  removeCartId,
  setCartId,
} from "./cookies"
import { getRegion } from "./regions"
import { getLocale } from "@lib/data/locale-cookie"

export type RetrieveCartOptions = {
  /**
   * Whether a lookup that did not simply come back "not found" should throw.
   *
   * Default false, which keeps every existing caller behaving as it did: any
   * failure reads as "there is no cart", which is the right answer for
   * getOrSetCart (it creates one) and for the cart page (it draws the empty
   * state).
   *
   * The checkout page passes true, and needs to: it turns a null cart into a
   * redirect away from checkout, so collapsing a backend outage into null told
   * a buyer holding a perfectly good cart that it had expired. Measured against
   * a dead backend with a valid cart cookie: the checkout page answered 404
   * while the cart page answered 500.
   */
  throwOnFailure?: boolean
}

/**
 * Retrieves a cart by its ID. If no ID is provided, it will use the cart ID from the cookies.
 * @param cartId - optional - The ID of the cart to retrieve.
 * @returns The cart object, or null if the cart does not exist (see options).
 */
export async function retrieveCart(
  cartId?: string,
  fields?: string,
  options: RetrieveCartOptions = {}
) {
  const id = cartId || (await getCartId())
  fields ??=
    "*items, *region, *items.product, *items.variant, *items.thumbnail, *items.metadata, +items.total, *promotions, +shipping_methods.name, *payment_collection, *payment_collection.payment_sessions"

  if (!id) {
    return null
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("carts")),
  }

  try {
    const { cart } = await sdk.client.fetch<HttpTypes.StoreCartResponse>(
      `/store/carts/${id}`,
      {
        method: "GET",
        query: {
          fields,
        },
        headers,
        next,
        cache: "force-cache",
      }
    )
    return cart
  } catch (err: any) {
    // The two outcomes are cleanly distinguishable and were measured against
    // the live backend, not assumed:
    //   missing cart    -> status 404, "Cart with id '…' not found"
    //   backend is down -> no status at all, "fetch failed"
    // The old single `.catch(() => null)` erased that difference, which is what
    // let a transient outage read as "your cart is gone".
    const status = err?.status ?? err?.response?.status

    if (status === 404) {
      return null
    }

    console.error("[retrieveCart] lookup failed", {
      cartId: id,
      status,
      error: err?.message ?? err,
    })

    if (options.throwOnFailure) {
      throw err
    }

    return null
  }
}

export async function getOrSetCart(countryCode: string) {
  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  let cart = await retrieveCart(undefined, "id,region_id,completed_at")

  // If the cookie points to a completed cart (cleanup from a previous order failed),
  // discard it so a fresh cart is created below.
  if (cart && (cart as any).completed_at) {
    await removeCartId().catch(() => {})
    cart = null
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  if (!cart) {
    const locale = await getLocale()
    const cartResp = await sdk.store.cart.create(
      { region_id: region.id, locale: locale || undefined },
      {},
      headers
    )
    cart = cartResp.cart

    await setCartId(cart.id)

    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  }

  if (cart && cart?.region_id !== region.id) {
    await sdk.store.cart.update(cart.id, { region_id: region.id }, {}, headers)
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  }

  return cart
}

export async function updateCart(data: HttpTypes.StoreUpdateCart) {
  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("No existing cart found, please create one before updating")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.cart
    .update(cartId, data, {}, headers)
    .then(async ({ cart }: { cart: HttpTypes.StoreCart }) => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)

      return cart
    })
    .catch(medusaError)
}

export async function addToCart({
  variantId,
  quantity,
  countryCode,
}: {
  variantId: string
  quantity: number
  countryCode: string
}) {
  if (!variantId) {
    throw new Error("Missing variant ID when adding to cart")
  }

  const cart = await getOrSetCart(countryCode)

  if (!cart) {
    throw new Error("Error retrieving or creating cart")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.cart
    .createLineItem(
      cart.id,
      {
        variant_id: variantId,
        quantity,
      },
      {},
      headers
    )
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)
    })
    .catch(medusaError)
}

export async function updateLineItem({
  lineId,
  quantity,
}: {
  lineId: string
  quantity: number
}) {
  if (!lineId) {
    throw new Error("Missing lineItem ID when updating line item")
  }

  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("Missing cart ID when updating line item")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.cart
    .updateLineItem(cartId, lineId, { quantity }, {}, headers)
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)
    })
    .catch(medusaError)
}

export async function deleteLineItem(lineId: string) {
  if (!lineId) {
    throw new Error("Missing lineItem ID when deleting line item")
  }

  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("Missing cart ID when deleting line item")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.cart
    .deleteLineItem(cartId, lineId, {}, headers)
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)
    })
    .catch(medusaError)
}

export async function setShippingMethod({
  cartId,
  shippingMethodId,
}: {
  cartId: string
  shippingMethodId: string
}) {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.cart
    .addShippingMethod(cartId, { option_id: shippingMethodId }, {}, headers)
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
    })
    .catch(medusaError)
}

export async function initiatePaymentSession(
  cart: HttpTypes.StoreCart,
  data: HttpTypes.StoreInitializePaymentSession
) {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const resp = await sdk.store.payment
    .initiatePaymentSession(cart, data, {}, headers)
    .catch(medusaError)

  // Revalidate cache separately so any failure here does NOT abort the payment flow.
  try {
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  } catch {
    // non-fatal: revalidateTag throws during Server Component render
  }

  return resp
}

export type PromotionResult =
  | { ok: true }
  | { ok: false; reason: "no_cart" | "invalid_code" | "unavailable" }

/**
 * Applies the exact set of promotion codes the cart should end up with.
 *
 * ⛔ Returns a result, never throws — and that is not a style choice. This runs
 * as a server action, and Next redacts the message of any error thrown in one
 * when NODE_ENV is production: the client receives "An error occurred in the
 * Server Components render..." verbatim. The previous version threw and the
 * discount box printed `e.message`, so every failure — wrong code, backend
 * down, expired cart — reached the buyer as that English sentence.
 *
 * ⚠️ And an unusable code is NOT an error from Medusa. updateCartPromotions
 * computes actions for the codes it can resolve and quietly drops the rest
 * (see prepareAdjustmentsFromPromotionActions: unknown codes produce no
 * action, and limit/budget exhaustion only lands in `skippedPromoCodes`,
 * which the store route does not return). A 200 therefore proves nothing.
 * The only reliable signal is the outcome: read the codes back off the
 * returned cart — `promotions.code` is in the store route's default fields —
 * and treat any code that did not land as rejected.
 */
export async function applyPromotions(
  codes: string[]
): Promise<PromotionResult> {
  const cartId = await getCartId()

  if (!cartId) {
    return { ok: false, reason: "no_cart" }
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  let cart: HttpTypes.StoreCart | undefined

  try {
    const result = await sdk.store.cart.update(
      cartId,
      { promo_codes: codes },
      {},
      headers
    )
    cart = result.cart
  } catch (error) {
    // Split on the status, not on the message. The SDK throws a FetchError
    // carrying the numeric HTTP status (js-sdk/client.js), and the code the
    // buyer typed is the only thing in this request they control — so a 4xx
    // means the code, while a 5xx, a timeout, or a DNS failure means us.
    //
    // ⚠️ Reporting an outage as a bad code sends the buyer hunting for another
    // code while theirs is fine; reporting a bad code as an outage tells them
    // to wait for a problem that will never clear. This branch exists because
    // it is NOT settled which one Medusa does: an unresolvable code is dropped
    // silently today (caught by the outcome check below), but a future version
    // rejecting it outright must not surface as "the server is down".
    const status = (error as { status?: number })?.status
    const reason =
      typeof status === "number" && status >= 400 && status < 500
        ? "invalid_code"
        : "unavailable"
    console.error("[promotions] apply failed", { cartId, codes, status, error })
    return { ok: false, reason }
  }

  // Non-fatal: revalidateTag throws when called during a Server Component
  // render, and losing the cache tag must not turn a successful apply into a
  // reported failure.
  try {
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)

    const fulfillmentCacheTag = await getCacheTag("fulfillment")
    revalidateTag(fulfillmentCacheTag)
  } catch {
    // ignored
  }

  const applied = new Set(
    (cart?.promotions ?? []).map((p) => p.code).filter(Boolean)
  )
  const rejected = codes.filter((code) => !applied.has(code))

  if (rejected.length > 0) {
    console.error("[promotions] codes not applied", { cartId, rejected })
    return { ok: false, reason: "invalid_code" }
  }

  return { ok: true }
}

export async function applyGiftCard(code: string) {
  //   const cartId = getCartId()
  //   if (!cartId) return "No cartId cookie found"
  //   try {
  //     await updateCart(cartId, { gift_cards: [{ code }] }).then(() => {
  //       revalidateTag("cart")
  //     })
  //   } catch (error: any) {
  //     throw error
  //   }
}

export async function removeDiscount(code: string) {
  // const cartId = getCartId()
  // if (!cartId) return "No cartId cookie found"
  // try {
  //   await deleteDiscount(cartId, code)
  //   revalidateTag("cart")
  // } catch (error: any) {
  //   throw error
  // }
}

export async function removeGiftCard(
  codeToRemove: string,
  giftCards: any[]
  // giftCards: GiftCard[]
) {
  //   const cartId = getCartId()
  //   if (!cartId) return "No cartId cookie found"
  //   try {
  //     await updateCart(cartId, {
  //       gift_cards: [...giftCards]
  //         .filter((gc) => gc.code !== codeToRemove)
  //         .map((gc) => ({ code: gc.code })),
  //     }).then(() => {
  //       revalidateTag("cart")
  //     })
  //   } catch (error: any) {
  //     throw error
  //   }
}

export async function submitPromotionForm(
  currentState: unknown,
  formData: FormData
) {
  const code = formData.get("code") as string
  const result = await applyPromotions([code])

  // Returns the machine-readable reason, not prose: this action has no caller
  // today, and whoever wires one must map the reason to a localised string the
  // way DiscountCode does. Never surface a raw error string to a buyer.
  return result.ok ? undefined : result.reason
}

// TODO: Pass a POJO instead of a form entity here
export async function setAddresses(currentState: unknown, formData: FormData) {
  try {
    if (!formData) {
      throw new Error("No form data found when setting addresses")
    }
    const cartId = await getCartId()
    if (!cartId) {
      throw new Error("No existing cart found when setting addresses")
    }

    const data = {
      shipping_address: {
        first_name: formData.get("shipping_address.first_name"),
        last_name: formData.get("shipping_address.last_name"),
        address_1: formData.get("shipping_address.address_1"),
        address_2: "",
        company: formData.get("shipping_address.company"),
        postal_code: formData.get("shipping_address.postal_code"),
        city: formData.get("shipping_address.city"),
        country_code: formData.get("shipping_address.country_code"),
        province: formData.get("shipping_address.province"),
        phone: formData.get("shipping_address.phone"),
      },
      email: formData.get("email"),
    } as any

    const sameAsBilling = formData.get("same_as_billing")
    if (sameAsBilling === "on") data.billing_address = data.shipping_address

    if (sameAsBilling !== "on")
      data.billing_address = {
        first_name: formData.get("billing_address.first_name"),
        last_name: formData.get("billing_address.last_name"),
        address_1: formData.get("billing_address.address_1"),
        address_2: "",
        company: formData.get("billing_address.company"),
        postal_code: formData.get("billing_address.postal_code"),
        city: formData.get("billing_address.city"),
        country_code: formData.get("billing_address.country_code"),
        province: formData.get("billing_address.province"),
        phone: formData.get("billing_address.phone"),
      }
    await updateCart(data)
  } catch (e: any) {
    return e.message
  }

  const rawCountryCode = formData.get("shipping_address.country_code")
  if (typeof rawCountryCode !== "string" || !/^[a-z]{2}$/.test(rawCountryCode)) {
    return "Invalid country code"
  }
  const isDigital = formData.get("is_digital") === "1"
  redirect(`/${rawCountryCode}/checkout?step=${isDigital ? "payment" : "delivery"}`)
}

/**
 * Places an order for a cart. If no cart ID is provided, it will use the cart ID from the cookies.
 * @param cartId - optional - The ID of the cart to place an order for.
 * @returns The cart object if the order was successful, or null if not.
 */
export async function placeOrder(cartId?: string) {
  const id = cartId || (await getCartId())

  if (!id) {
    throw new Error("No existing cart found when placing an order")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const cartRes = await sdk.store.cart
    .complete(id, {}, headers)
    .catch(medusaError)

  try {
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  } catch {
    // non-fatal
  }

  if (cartRes?.type === "order") {
    const countryCode =
      cartRes.order.shipping_address?.country_code?.toLowerCase()

    try {
      const orderCacheTag = await getCacheTag("orders")
      revalidateTag(orderCacheTag)
    } catch {
      // non-fatal
    }

    await removeCartId()
    redirect(`/${countryCode ?? "sa"}/order/${cartRes.order.id}/confirmed`)
  }

  return cartRes.cart
}

/**
 * Completes a cart and returns the created order without performing internal redirects.
 * Used by the Moyasar callback page to complete the cart after payment verification.
 */
export async function completeCart(cartId?: string): Promise<{ orderId: string; countryCode: string } | null> {
  const id = cartId || (await getCartId())
  if (!id) return null

  const headers = { ...(await getAuthHeaders()) }

  let cartRes: any
  try {
    cartRes = await sdk.store.cart.complete(id, {}, headers)
  } catch (err: any) {
    // Only /checkout/moyasar-callback calls this, and it reaches here *after*
    // Moyasar confirmed the charge — so a silent null here is a paid buyer with
    // no order and nothing in the logs to find them by. The reason (a rejected
    // authorizePayment, an amount mismatch, a backend that is down) only exists
    // in this error object; the caller sees null either way.
    console.error("[completeCart] cart.complete failed", {
      cartId: id,
      status: err?.status ?? err?.response?.status,
      error: err?.message ?? err,
    })
    return null
  }

  try {
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  } catch {
    // non-fatal: revalidateTag throws during Server Component render
  }

  if (cartRes?.type === "order") {
    try {
      const orderCacheTag = await getCacheTag("orders")
      revalidateTag(orderCacheTag)
    } catch {
      // non-fatal: revalidateTag throws during Server Component render
    }
    try {
      await removeCartId()
    } catch {
      // non-fatal: cookies.set throws during Server Component render
    }
    const orderId = cartRes.order.id
    const countryCode = cartRes.order.shipping_address?.country_code?.toLowerCase() ?? "sa"
    return { orderId, countryCode }
  }

  return null
}

/**
 * Updates the countrycode param and revalidates the regions cache
 * @param regionId
 * @param countryCode
 */
export async function updateRegion(countryCode: string, currentPath: string) {
  const cartId = await getCartId()
  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  if (cartId) {
    await updateCart({ region_id: region.id })
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  }

  const regionCacheTag = await getCacheTag("regions")
  revalidateTag(regionCacheTag)

  const productsCacheTag = await getCacheTag("products")
  revalidateTag(productsCacheTag)

  redirect(`/${countryCode}${currentPath}`)
}

export async function listCartOptions() {
  const cartId = await getCartId()
  const headers = {
    ...(await getAuthHeaders()),
  }
  const next = {
    ...(await getCacheOptions("shippingOptions")),
  }

  return await sdk.client.fetch<{
    shipping_options: HttpTypes.StoreCartShippingOption[]
  }>("/store/shipping-options", {
    query: { cart_id: cartId },
    next,
    headers,
    cache: "force-cache",
  })
}
