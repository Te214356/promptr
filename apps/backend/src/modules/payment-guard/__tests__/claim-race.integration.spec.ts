import { moduleIntegrationTestRunner } from "@medusajs/test-utils"
import { PAYMENT_GUARD_MODULE } from ".."
import { MoyasarPaymentClaim } from "../models/moyasar-payment-claim"
import PaymentGuardService from "../service"

/**
 * The half the unit tests cannot reach.
 *
 * `claim.unit.spec.ts` stubs the two data methods, so everything it proves is
 * about branching on an error someone hands it. It says nothing about the thing
 * the guard is actually built on: a unique index in Postgres, and the promise
 * that two requests racing for the same payment cannot both win.
 *
 * Needs a real database (`TEST_TYPE=integration:modules`), which is why it is
 * separate — and why the claim in CLAUDE.md that concurrency is handled was
 * prose until this ran.
 */
moduleIntegrationTestRunner<PaymentGuardService>({
  moduleName: PAYMENT_GUARD_MODULE,
  moduleModels: [MoyasarPaymentClaim],
  resolve: "./src/modules/payment-guard",
  testSuite: ({ service }) => {
    describe("spending a Moyasar payment, against a real unique index", () => {
      const payment = () => `pay_${Math.random().toString(36).slice(2, 12)}`

      it("lets the first cart spend it", async () => {
        const id = payment()

        await expect(service.claimMoyasarPayment(id, "cart_first")).resolves.toEqual(
          { status: "claimed" }
        )
      })

      // The replay. This is the assertion the whole payment-guard module exists
      // for, finally made against Postgres rather than a stubbed error.
      it("refuses the same payment on a second cart", async () => {
        const id = payment()

        await service.claimMoyasarPayment(id, "cart_first")

        await expect(
          service.claimMoyasarPayment(id, "cart_second")
        ).resolves.toEqual({
          status: "claimed_by_other_cart",
          claimedFor: "cart_first",
        })
      })

      // Guards the regression that shipped and was caught in review: the error
      // Medusa's data layer actually throws is a MedusaError with no pg code,
      // and matching only the raw shape refused every buyer retrying on their
      // own cart. Here the error is real, so a wrong matcher fails the test.
      it("lets the same cart re-present its own payment", async () => {
        const id = payment()

        await service.claimMoyasarPayment(id, "cart_first")

        await expect(
          service.claimMoyasarPayment(id, "cart_first")
        ).resolves.toEqual({ status: "already_claimed_by_same_cart" })
      })

      // Concurrency, not sequence: the two claims are in flight together, so a
      // read-then-write implementation would let both conclude "unspent". Only
      // one may end up claimed, and the loser must name the winner's cart.
      it("admits exactly one of two simultaneous claims", async () => {
        const id = payment()

        const outcomes = await Promise.all([
          service.claimMoyasarPayment(id, "cart_a"),
          service.claimMoyasarPayment(id, "cart_b"),
        ])

        const claimed = outcomes.filter((o) => o.status === "claimed")
        expect(claimed).toHaveLength(1)

        const loser = outcomes.find((o) => o.status !== "claimed")!
        expect(loser.status).toBe("claimed_by_other_cart")

        // Whichever won, the refusal must point at the cart that actually holds
        // the payment — that string is what a support ticket gets resolved by.
        const winnerCart = outcomes[0].status === "claimed" ? "cart_a" : "cart_b"
        expect((loser as any).claimedFor).toBe(winnerCart)
      })

      it("keeps separate payments independent", async () => {
        const first = payment()
        const second = payment()

        await service.claimMoyasarPayment(first, "cart_one")

        await expect(
          service.claimMoyasarPayment(second, "cart_two")
        ).resolves.toEqual({ status: "claimed" })
      })
    })
  },
})
