import { MedusaError } from "@medusajs/framework/utils"
import PaymentGuardService, {
  decideClaimOutcome,
  isUniqueViolation,
} from "../service"

/**
 * A payment is money, and money is spent once.
 *
 * These exercise the real `claimMoyasarPayment` body with the two database
 * calls stubbed, so the branch that matters — an insert that lost the race for
 * the unique index — is covered without needing a Postgres to lose a race
 * against.
 */

const PAYMENT = "pay_spent_once"
const FIRST_CART = "cart_first"
const SECOND_CART = "cart_second"

/**
 * What a second insert on the unique index ACTUALLY produces here.
 *
 * Not the pg error: Medusa wraps every repository promise with `dbErrorMapper`,
 * which translates SQLSTATE 23505 into this MedusaError. An earlier version of
 * this file asserted against a hand-rolled pg error instead — it passed while
 * the production path was refusing every legitimate retry, which is the whole
 * reason the real shape is spelled out here.
 */
function mappedUniqueViolation() {
  return new MedusaError(
    MedusaError.Types.INVALID_DATA,
    "Moyasar payment claim with moyasar_id: pay_spent_once, already exists."
  )
}

/** The untranslated shape, still reachable when pg omits `detail`. */
function rawUniqueViolation() {
  return Object.assign(new Error("duplicate key value violates unique constraint"), {
    code: "23505",
  })
}

function makeGuard(opts: {
  onCreate: () => void | never
  existing?: { cart_id: string }[]
}) {
  // Built without the module container: the method under test only uses the two
  // generated data methods, and both are replaced here.
  const guard: PaymentGuardService = Object.create(PaymentGuardService.prototype)

  ;(guard as any).createMoyasarPaymentClaims = jest.fn(async () => opts.onCreate())
  ;(guard as any).listMoyasarPaymentClaims = jest.fn(async () => opts.existing ?? [])

  return guard
}

describe("claimMoyasarPayment", () => {
  it("lets the first cart spend the payment", async () => {
    const guard = makeGuard({ onCreate: () => undefined })

    await expect(
      guard.claimMoyasarPayment(PAYMENT, FIRST_CART)
    ).resolves.toEqual({ status: "claimed" })
  })

  // The negative case this change was made for: one real payment, a second cart.
  it("refuses the same payment on a second cart", async () => {
    const guard = makeGuard({
      onCreate: () => {
        throw mappedUniqueViolation()
      },
      existing: [{ cart_id: FIRST_CART }],
    })

    await expect(
      guard.claimMoyasarPayment(PAYMENT, SECOND_CART)
    ).resolves.toEqual({
      status: "claimed_by_other_cart",
      claimedFor: FIRST_CART,
    })
  })

  it("lets the same cart re-present its own payment, so a retry is not a lockout", async () => {
    const guard = makeGuard({
      onCreate: () => {
        throw mappedUniqueViolation()
      },
      existing: [{ cart_id: FIRST_CART }],
    })

    await expect(
      guard.claimMoyasarPayment(PAYMENT, FIRST_CART)
    ).resolves.toEqual({ status: "already_claimed_by_same_cart" })
  })

  it("does not turn an unrelated database failure into a refusal", async () => {
    const guard = makeGuard({
      onCreate: () => {
        throw new Error("connection terminated unexpectedly")
      },
    })

    // Refusing here would be wrong in the other direction: it would hide a real
    // outage behind a message about the payment.
    await expect(
      guard.claimMoyasarPayment(PAYMENT, FIRST_CART)
    ).rejects.toThrow(/connection terminated/)
  })
})

describe("the data methods claimMoyasarPayment calls", () => {
  /**
   * makeGuard above replaces `createMoyasarPaymentClaims` and
   * `listMoyasarPaymentClaims` with stubs — which means every test in this file
   * would still pass if MedusaService generated those methods under different
   * names and production threw "not a function" on the first purchase. This is
   * the one assertion that touches the real generated class, so the stubs are
   * standing in for something that exists.
   */
  it("exist on the real generated service", () => {
    const proto = PaymentGuardService.prototype as any
    expect(typeof proto.createMoyasarPaymentClaims).toBe("function")
    expect(typeof proto.listMoyasarPaymentClaims).toBe("function")
  })
})

describe("decideClaimOutcome", () => {
  it("refuses when the winning row cannot be read back", () => {
    // Refusing costs a buyer one retry; allowing costs a product.
    expect(decideClaimOutcome(FIRST_CART, undefined)).toEqual({
      status: "claimed_by_other_cart",
      claimedFor: "(unknown)",
    })
  })
})

describe("isUniqueViolation", () => {
  // The shape production actually throws. Regression guard: when this stopped
  // matching, every buyer retrying on their own cart was refused permanently.
  it("recognises the MedusaError that dbErrorMapper produces", () => {
    expect(isUniqueViolation(mappedUniqueViolation())).toBe(true)
  })

  it("still recognises the untranslated driver shapes", () => {
    expect(isUniqueViolation(rawUniqueViolation())).toBe(true)
    expect(isUniqueViolation({ code: "23505" })).toBe(true)
    expect(isUniqueViolation({ cause: { code: "23505" } })).toBe(true)
  })

  it("does not mistake other failures for it", () => {
    expect(isUniqueViolation(new Error("connection terminated"))).toBe(false)
    expect(isUniqueViolation({ code: "08006" })).toBe(false)
    expect(
      isUniqueViolation(
        new MedusaError(MedusaError.Types.NOT_FOUND, "Cart not found")
      )
    ).toBe(false)
  })
})
