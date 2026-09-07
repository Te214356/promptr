import MoyasarProviderService from "../service"

/**
 * The hole these tests exist for: a Moyasar payment used to be tied to a cart by
 * nothing but its amount, so one real payment could complete any other cart of
 * the same total — repeatedly, each time producing an order and an email of
 * signed download links. Four products in this catalogue share a price, so this
 * was not theoretical.
 *
 * The binding under test is metadata.cart_id, written when the payment is
 * created and read back from Moyasar's own record.
 */

const PAID_CART = "cart_paid_for_this_one"
const OTHER_CART = "cart_somewhere_else"
const AMOUNT = 6900

function makeService() {
  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }

  const service = new MoyasarProviderService(
    { logger } as any,
    { publishableKey: "pk_test", secretKey: "sk_test" } as any
  )

  return { service, logger }
}

/** Stands in for Moyasar's GET /payments/:id. */
function stubMoyasar(payment: Record<string, unknown>) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => payment,
  }) as any
}

function paidPayment(overrides: Record<string, unknown> = {}) {
  return {
    id: "pay_real_and_genuinely_paid",
    status: "paid",
    amount: AMOUNT,
    currency: "SAR",
    metadata: { cart_id: PAID_CART },
    ...overrides,
  }
}

const initiateInput = (cartId: string | undefined) =>
  ({
    amount: AMOUNT,
    currency_code: "sar",
    data: { moyasar_id: "pay_real_and_genuinely_paid", cart_id: cartId },
  } as any)

afterEach(() => {
  jest.restoreAllMocks()
})

describe("initiatePayment — which cart a payment may be spent on", () => {
  it("accepts the cart the payment was actually made for", async () => {
    const { service } = makeService()
    stubMoyasar(paidPayment())

    const result = await service.initiatePayment(initiateInput(PAID_CART))

    expect(result.data).toMatchObject({
      moyasar_id: "pay_real_and_genuinely_paid",
      cart_id: PAID_CART,
      moyasar_cart_id: PAID_CART,
      expected_amount: AMOUNT,
      expected_currency: "sar",
    })
  })

  // The replay this whole change exists to stop.
  it("refuses the same payment when it is presented for a second cart", async () => {
    const { service } = makeService()
    stubMoyasar(paidPayment())

    await expect(
      service.initiatePayment(initiateInput(OTHER_CART))
    ).rejects.toThrow(/not made for this cart/i)
  })

  it("refuses a payment that carries no cart binding at all", async () => {
    const { service } = makeService()
    stubMoyasar(paidPayment({ metadata: {} }))

    // Absent must never read as "matches" — that is precisely how every
    // pre-existing payment would have stayed replayable.
    await expect(
      service.initiatePayment(initiateInput(PAID_CART))
    ).rejects.toThrow(/not made for this cart/i)
  })

  it("refuses when the server could not name the cart being paid", async () => {
    const { service } = makeService()
    stubMoyasar(paidPayment())

    await expect(
      service.initiatePayment(initiateInput(undefined))
    ).rejects.toThrow(/not made for this cart/i)
  })
})

describe("authorizePayment — the same question asked again at the money step", () => {
  const sessionData = (overrides: Record<string, unknown> = {}) => ({
    moyasar_id: "pay_real_and_genuinely_paid",
    cart_id: PAID_CART,
    moyasar_cart_id: PAID_CART,
    expected_amount: AMOUNT,
    expected_currency: "sar",
    ...overrides,
  })

  it("authorizes an ordinary purchase", async () => {
    const { service } = makeService()
    stubMoyasar(paidPayment())

    const result = await service.authorizePayment({ data: sessionData() } as any)

    expect(result.status).toBe("captured")
  })

  it("refuses to authorize a payment made for another cart", async () => {
    const { service } = makeService()
    stubMoyasar(paidPayment())

    const result = await service.authorizePayment({
      data: sessionData({ cart_id: OTHER_CART }),
    } as any)

    expect(result.status).toBe("error")
    expect(result.data).toMatchObject({ cart_binding_mismatch: true })
  })

  it("refuses a session with no cart binding rather than trusting it", async () => {
    const { service } = makeService()
    stubMoyasar(paidPayment())

    const result = await service.authorizePayment({
      data: sessionData({ cart_id: undefined }),
    } as any)

    expect(result.status).toBe("error")
  })

  // Regression guard: the amount check predates the binding and must survive it.
  it("still refuses an underpaid cart", async () => {
    const { service } = makeService()
    stubMoyasar(paidPayment({ amount: 100 }))

    const result = await service.authorizePayment({ data: sessionData() } as any)

    expect(result.status).toBe("error")
    expect(result.data).toMatchObject({ amount_mismatch: true })
  })
})
