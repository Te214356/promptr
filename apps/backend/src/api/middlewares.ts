import {
  defineMiddlewares,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { PAYMENT_GUARD_MODULE } from "../modules/payment-guard"
import type PaymentGuardService from "../modules/payment-guard/service"

const MOYASAR_PROVIDER_ID = "pp_moyasar_moyasar"

/**
 * What a buyer is told when a payment is refused here.
 *
 * Deliberately says nothing about *why*. Every path that reaches it is either
 * someone spending a payment where it does not belong — who should learn
 * nothing about how the check works — or a genuine buyer in an edge case, for
 * whom "cart binding mismatch" would be noise. The real reason is in the server
 * log, keyed by the payment id.
 */
const REFUSED_MESSAGE =
  "تعذّر إكمال هذا الطلب. إن كان قد خُصم منك مبلغ فلا تُعد الدفع — تواصل معنا وسنُكمل طلبك."

/** Link traversal returns either the single linked record or a one-item array. */
function firstLinked<T>(value: T | T[] | undefined | null): T | undefined {
  return Array.isArray(value) ? value[0] : value ?? undefined
}

/**
 * Names, on the server, which cart is being paid for.
 *
 * The whole point is that the caller does not get to say. A Moyasar payment
 * records the cart it was created for (metadata.cart_id) and the provider
 * compares the two — but that comparison is worthless if the other side of it
 * also comes from the request body, since an attacker would simply supply the
 * cart id its own payment names. So the value is derived from the payment
 * collection in the URL, which is linked to exactly one cart, and it overwrites
 * anything the client sent under the same key.
 *
 * 🔊 If this middleware ever stops running — reordered, renamed, dropped in a
 * refactor — the guard does not quietly disappear: the provider refuses a
 * payment with no cart binding, so every Moyasar payment starts failing at once
 * and loudly. That is deliberate. A security check that can go missing without
 * anyone noticing is worse than one that breaks the checkout when it goes
 * missing.
 */
async function bindCartToMoyasarSession(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const body = req.body as Record<string, any> | undefined

  if (body?.provider_id !== MOYASAR_PROVIDER_ID) {
    return next()
  }

  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "payment_collection",
      fields: ["id", "cart.id"],
      filters: { id: req.params.id },
    })

    const cartId = firstLinked<{ id: string }>(data?.[0]?.cart)?.id

    if (!cartId) {
      // A Moyasar session on a payment collection that belongs to no cart is
      // not a shape this storefront produces. Refuse rather than continue with
      // an unbindable session — an unbound session is a replayable one.
      req.scope
        .resolve(ContainerRegistrationKeys.LOGGER)
        .error(
          `[payment-guard] no cart linked to payment collection ${req.params.id} — refusing Moyasar session`
        )
      return res.status(409).json({ message: REFUSED_MESSAGE })
    }

    // Overwrite, never merge: a client-supplied cart_id has no standing here.
    body.data = { ...(body.data ?? {}), cart_id: cartId }
    req.body = body

    return next()
  } catch (err) {
    return next(err)
  }
}

/**
 * Spends the Moyasar payment attached to this cart, once.
 *
 * Placed on cart completion rather than on session creation on purpose. The
 * claim is permanent, so making it earlier would let a buyer whose cookie still
 * points at a stale cart burn their payment on the wrong cart and then be
 * locked out of the right one. By the time a request reaches here the provider
 * has already checked that the payment was made for this cart, so the only
 * thing left to establish is that it has not been spent already.
 *
 * Cross-cart replay is refused; the same cart re-presenting the same payment is
 * a buyer retrying after a failure, and is allowed through.
 */
async function claimMoyasarPaymentForCart(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const cartId = req.params.id
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "cart",
      fields: [
        "id",
        "payment_collection.payment_sessions.id",
        "payment_collection.payment_sessions.provider_id",
        "payment_collection.payment_sessions.data",
      ],
      filters: { id: cartId },
    })

    const collection = firstLinked<{ payment_sessions?: any[] }>(
      data?.[0]?.payment_collection
    )
    const session = (collection?.payment_sessions ?? []).find(
      (s: any) => s?.provider_id === MOYASAR_PROVIDER_ID && s?.data?.moyasar_id
    )

    // No Moyasar payment on this cart — nothing to spend, nothing to guard.
    if (!session) {
      return next()
    }

    const moyasarId = String(session.data.moyasar_id)
    const guard = req.scope.resolve(
      PAYMENT_GUARD_MODULE
    ) as PaymentGuardService
    const outcome = await guard.claimMoyasarPayment(moyasarId, cartId)

    if (outcome.status === "claimed_by_other_cart") {
      logger.error(
        `[payment-guard] REPLAY REFUSED — Moyasar payment ${moyasarId} was already ` +
          `spent on cart ${outcome.claimedFor}; refused for cart ${cartId}`
      )
      return res.status(409).json({ message: REFUSED_MESSAGE })
    }

    return next()
  } catch (err) {
    // ⛔ Do not swallow this into next(). A failure here means the "spent only
    // once" record was not written, and letting the completion proceed anyway
    // would make the guard silently optional exactly when it is broken.
    logger.error(
      `[payment-guard] claim failed for cart ${cartId}: ${
        (err as Error)?.message ?? err
      }`
    )
    return res.status(409).json({ message: REFUSED_MESSAGE })
  }
}

export default defineMiddlewares({
  routes: [
    {
      method: ["POST"],
      matcher: "/store/payment-collections/:id/payment-sessions",
      middlewares: [bindCartToMoyasarSession],
    },
    {
      method: ["POST"],
      matcher: "/store/carts/:id/complete",
      middlewares: [claimMoyasarPaymentForCart],
    },
  ],
})
