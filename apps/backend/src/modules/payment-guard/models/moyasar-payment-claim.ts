import { model } from "@medusajs/framework/utils"

/**
 * One row per Moyasar payment that has been spent on a cart.
 *
 * This is the "a payment is money, and money is spent once" record. It exists
 * because nothing in Medusa keeps one: `createPaymentSession` throws away the
 * id a payment provider returns (see @medusajs/payment payment-module.js), and
 * `authorizePaymentSession` is idempotent only *within* a session — a second
 * session on a second cart has no memory of the first. So a genuinely paid
 * Moyasar payment could be presented again, and again, each time producing a
 * completed order and an email of signed download links.
 *
 * ⚠️ `moyasar_id` is unique, and that uniqueness is the whole mechanism. The
 * claim is made by a single INSERT: Postgres decides who wins when two requests
 * race, so there is no read-then-write window to lose. Do not "optimise" this
 * into a SELECT followed by an INSERT, and do not drop the unique index and
 * rely on the service checking first — both reintroduce exactly the race this
 * table was added to remove.
 *
 * `cart_id` is stored, not just the id, so a re-presentation can be told apart:
 * the same payment offered again for the SAME cart is a buyer retrying after a
 * failure and is allowed through; offered for a DIFFERENT cart it is a replay
 * and is refused.
 */
export const MoyasarPaymentClaim = model.define("moyasar_payment_claim", {
  id: model.id().primaryKey(),
  /** Moyasar's payment id — the thing being spent. */
  moyasar_id: model.text().unique(),
  /** The cart this payment was spent on. */
  cart_id: model.text(),
})
