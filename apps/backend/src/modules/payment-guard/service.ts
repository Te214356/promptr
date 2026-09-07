import { MedusaError, MedusaService } from "@medusajs/framework/utils"
import { MoyasarPaymentClaim } from "./models/moyasar-payment-claim"

/** Postgres unique_violation. */
const PG_UNIQUE_VIOLATION = "23505"

/**
 * True when an insert lost the race for a unique key.
 *
 * ⚠️ The shape that actually arrives here is NOT the pg error. Every repository
 * promise in Medusa is wrapped with `dbErrorMapper`
 * (@medusajs/utils dal/mikro-orm/mikro-orm-repository.js), which turns a 23505
 * into `MedusaError(INVALID_DATA, "Moyasar payment claim with moyasar_id: …,
 * already exists.")` — carrying no `code`, no pg class name, and none of the
 * words "duplicate key" or "unique constraint". A first version of this
 * function checked only for those, matched nothing, and so refused every buyer
 * who retried on their own cart: the "same cart may re-present its payment"
 * path was unreachable in production while its unit tests passed against a
 * fabricated pg error.
 *
 * The raw shapes are still checked because dbErrorMapper rethrows untouched
 * when Postgres omits `detail`, and because a direct-SQL path would bypass the
 * wrapper entirely.
 */
export function isUniqueViolation(err: any): boolean {
  const message = String(err?.message ?? "")

  // What the ORM layer actually hands us. Matched on the `type` field rather
  // than `instanceof`: the error is constructed in @medusajs/utils and read
  // here through @medusajs/framework/utils, and while those resolve to one
  // class today, a duplicated copy of the package in a nested node_modules
  // would silently break an identity check — and break it in the direction
  // that locks buyers out.
  if (
    err?.type === MedusaError.Types.INVALID_DATA &&
    /already exists/i.test(message)
  ) {
    return true
  }

  // What the driver hands us when the mapper declines to translate it.
  return (
    err?.code === PG_UNIQUE_VIOLATION ||
    err?.cause?.code === PG_UNIQUE_VIOLATION ||
    err?.constructor?.name === "UniqueConstraintViolationException" ||
    /duplicate key value|unique constraint/i.test(message)
  )
}

export type ClaimOutcome =
  /** This request is the one that spent the payment. */
  | { status: "claimed" }
  /** Already spent, on this same cart — a buyer retrying, not a replay. */
  | { status: "already_claimed_by_same_cart" }
  /** Already spent, on another cart — a replay. Refuse. */
  | { status: "claimed_by_other_cart"; claimedFor: string }

/**
 * Decides an outcome from what the database did.
 *
 * Split out from the write so the decision is testable without a Postgres:
 * the interesting cases are the two "already spent" ones, and neither depends
 * on how the row got there.
 */
export function decideClaimOutcome(
  cartId: string,
  existingCartId: string | undefined
): ClaimOutcome {
  if (existingCartId === undefined) {
    // Unique violation, yet no row to read. Only reachable if the winner rolled
    // back between our insert failing and our read — treat as a replay rather
    // than waving it through: refusing costs a buyer one retry, allowing it
    // costs a product.
    return { status: "claimed_by_other_cart", claimedFor: "(unknown)" }
  }
  return existingCartId === cartId
    ? { status: "already_claimed_by_same_cart" }
    : { status: "claimed_by_other_cart", claimedFor: existingCartId }
}

class PaymentGuardService extends MedusaService({ MoyasarPaymentClaim }) {
  /**
   * Spends `moyasarId` on `cartId`, once and only once.
   *
   * The insert is the claim — there is deliberately no "has this been claimed?"
   * read before it. Two callbacks arriving at the same instant both insert;
   * Postgres lets exactly one through the unique index and the loser blocks
   * until the winner commits, then reads the committed row. A read-first
   * version would let both see "not claimed" and both proceed.
   */
  async claimMoyasarPayment(
    moyasarId: string,
    cartId: string
  ): Promise<ClaimOutcome> {
    try {
      await this.createMoyasarPaymentClaims({
        moyasar_id: moyasarId,
        cart_id: cartId,
      })
      return { status: "claimed" }
    } catch (err) {
      if (!isUniqueViolation(err)) {
        throw err
      }

      const [existing] = await this.listMoyasarPaymentClaims({
        moyasar_id: moyasarId,
      })

      return decideClaimOutcome(cartId, existing?.cart_id)
    }
  }
}

export default PaymentGuardService
