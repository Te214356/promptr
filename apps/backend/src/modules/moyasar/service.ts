import { AbstractPaymentProvider, BigNumber, MedusaError } from "@medusajs/framework/utils"
import {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  PaymentSessionStatus,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types"
import { Logger } from "@medusajs/framework/types"

type Options = {
  publishableKey: string
  secretKey: string
  apiUrl?: string
}

type InjectedDependencies = {
  logger: Logger
}

type ProviderError = {
  error: string
  code: string
  detail: string
}

const MOYASAR_API_URL = "https://api.moyasar.com/v1"

// PaymentSessionStatus is a string union type, not an enum
const STATUS = {
  PENDING: "pending" as PaymentSessionStatus,
  AUTHORIZED: "authorized" as PaymentSessionStatus,
  CAPTURED: "captured" as PaymentSessionStatus,
  CANCELED: "canceled" as PaymentSessionStatus,
  ERROR: "error" as PaymentSessionStatus,
}

class MoyasarProviderService extends AbstractPaymentProvider<Options> {
  static identifier = "moyasar"

  protected options_: Options
  protected logger_: Logger
  protected apiUrl_: string

  constructor({ logger }: InjectedDependencies, options: Options) {
    super({ logger }, options)
    this.logger_ = logger
    this.options_ = options
    this.apiUrl_ = options.apiUrl || MOYASAR_API_URL
  }

  private getAuthHeader(): string {
    const credentials = Buffer.from(`${this.options_.secretKey}:`).toString("base64")
    return `Basic ${credentials}`
  }

  private async moyasarRequest<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const response = await fetch(`${this.apiUrl_}${path}`, {
      method,
      headers: {
        Authorization: this.getAuthHeader(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    const data = await response.json()

    if (!response.ok) {
      const message =
        (data as any)?.message ||
        (data as any)?.errors?.join(", ") ||
        "Moyasar API error"
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, message)
    }

    return data as T
  }

  private toMoyasarAmount(amount: BigNumber | number | string): number {
    return Math.round(Number(amount))
  }

  private mapStatus(moyasarStatus: string): PaymentSessionStatus {
    switch (moyasarStatus) {
      case "initiated":
        return STATUS.PENDING
      case "paid":
        return STATUS.AUTHORIZED
      case "captured":
        return STATUS.CAPTURED
      case "refunded":
      case "voided":
        return STATUS.CANCELED
      case "failed":
        return STATUS.ERROR
      default:
        return STATUS.PENDING
    }
  }

  private buildError(message: string, error: unknown): ProviderError {
    const err = error as Error
    this.logger_.error(message, err)
    return {
      error: message,
      code: "moyasar_error",
      detail: err?.message || String(error),
    }
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const { data } = input

    // Pin what this session is *supposed* to cost, straight from Medusa's cart.
    // authorizePayment receives only { data, context } — no amount — so without
    // stashing it here there is nothing to compare Moyasar's figure against.
    // Same conversion used when sending an amount to Moyasar, so both sides of
    // the later comparison are on one scale.
    const expected = {
      expected_amount: this.toMoyasarAmount(input.amount as number),
      expected_currency: input.currency_code?.toLowerCase(),
    }

    // If moyasar_id is provided (from the callback after MPF payment), verify it.
    if (data?.moyasar_id) {
      try {
        const payment = await this.moyasarRequest<any>("GET", `/payments/${data.moyasar_id}`)
        return {
          id: payment.id,
          data: {
            moyasar_id: payment.id,
            moyasar_status: payment.status,
            ...expected,
          },
        }
      } catch (error) {
        this.buildError("Failed to verify Moyasar payment", error)
        throw error
      }
    }

    // No card details yet — the Moyasar.js form will collect them client-side.
    // Return a pending local session; moyasar_id will be set after the MPF callback.
    return {
      id: `ms_pending_${Date.now()}`,
      data: { status: "pending", ...expected },
    }
  }

  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const { data } = input
    const moyasarId = data?.moyasar_id as string

    if (!moyasarId) {
      return { status: STATUS.PENDING, data }
    }

    // Moyasar's API can return "initiated" briefly after 3DS completes before
    // transitioning to "paid". Retry up to 3 times (6s total) to handle this lag.
    // Only "paid" or "captured" from the API are accepted — never trust URL params.
    const AUTHORIZED_STATUSES = ["paid", "captured"]
    const TERMINAL_STATUSES = ["failed", "voided", "refunded"]
    const MAX_ATTEMPTS = 3
    const RETRY_DELAY_MS = 2000

    let lastPayment: any = null

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const payment = await this.moyasarRequest<any>("GET", `/payments/${moyasarId}`)
        lastPayment = payment

        this.logger_.info(
          `[moyasar] authorizePayment attempt=${attempt}/${MAX_ATTEMPTS} ` +
          `id=${payment.id} status=${payment.status} amount=${payment.amount} ` +
          `source_type=${payment.source?.type} source_message=${payment.source?.message ?? "none"}`
        )

        if (AUTHORIZED_STATUSES.includes(payment.status)) {
          // A successful payment is not necessarily the *right* payment. The
          // Moyasar form is initialised in the browser, so its amount is under
          // the buyer's control; without this check, paying 1 SAR for a full
          // cart would authorize and the digital goods would ship immediately.
          //
          // Both figures are in the minor unit (halalas): Medusa stores prices
          // that way (a 99.00 SAR product returns calculated_amount 9900) and
          // Moyasar uses the same, which is why updatePayment already forwards
          // Medusa's amount to Moyasar untouched.
          const expectedAmount = data?.expected_amount as number | undefined
          const expectedCurrency = (data?.expected_currency as string | undefined)?.toLowerCase()
          const paidAmount = Math.round(Number(payment.amount))
          const paidCurrency = String(payment.currency ?? "").toLowerCase()

          if (typeof expectedAmount !== "number" || !expectedCurrency) {
            // Fail closed: an unverifiable session is refused rather than
            // trusted. Only reachable for a session created before this check
            // existed; the buyer can simply retry checkout.
            this.logger_.error(
              `[moyasar] AMOUNT CHECK SKIPPED — refusing to authorize. ` +
              `id=${payment.id} paid=${paidAmount} ${paidCurrency} ` +
              `expected=missing (session predates amount pinning)`
            )
            return {
              status: STATUS.ERROR,
              data: { ...data, moyasar_id: payment.id, moyasar_status: payment.status },
            }
          }

          if (paidAmount !== expectedAmount || paidCurrency !== expectedCurrency) {
            this.logger_.error(
              `[moyasar] AMOUNT MISMATCH — refusing to authorize. ` +
              `id=${payment.id} paid=${paidAmount} ${paidCurrency} ` +
              `expected=${expectedAmount} ${expectedCurrency} ` +
              `diff=${paidAmount - expectedAmount}`
            )
            return {
              status: STATUS.ERROR,
              data: {
                ...data,
                moyasar_id: payment.id,
                moyasar_status: payment.status,
                amount_mismatch: true,
                paid_amount: paidAmount,
                paid_currency: paidCurrency,
              },
            }
          }

          return {
            status: this.mapStatus(payment.status),
            data: { ...data, moyasar_id: payment.id, moyasar_status: payment.status },
          }
        }

        if (TERMINAL_STATUSES.includes(payment.status)) {
          this.logger_.warn(`[moyasar] authorizePayment: terminal status=${payment.status} id=${payment.id}`)
          return {
            status: this.mapStatus(payment.status),
            data: { ...data, moyasar_id: payment.id, moyasar_status: payment.status },
          }
        }

        // status is "initiated" — not yet confirmed, wait and retry
        if (attempt < MAX_ATTEMPTS) {
          this.logger_.info(`[moyasar] authorizePayment: status=initiated, retrying in ${RETRY_DELAY_MS}ms`)
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
        }
      } catch (error) {
        this.buildError("Failed to authorize Moyasar payment", error)
        throw error
      }
    }

    // Payment still "initiated" after all retries — not yet confirmed by Moyasar API
    this.logger_.warn(
      `[moyasar] authorizePayment: still initiated after ${MAX_ATTEMPTS} attempts, ` +
      `id=${lastPayment?.id} — returning PENDING`
    )
    return {
      status: STATUS.PENDING,
      data: { ...data, moyasar_status: lastPayment?.status },
    }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    const { data } = input
    const moyasarId = data?.moyasar_id as string

    try {
      const payment = await this.moyasarRequest<any>("POST", `/payments/${moyasarId}/capture`)

      return {
        data: {
          ...data,
          moyasar_status: payment.status,
        },
      }
    } catch (error) {
      return this.buildError("Failed to capture Moyasar payment", error) as any
    }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    const { data } = input
    const moyasarId = data?.moyasar_id as string

    try {
      const payment = await this.moyasarRequest<any>("POST", `/payments/${moyasarId}/void`)

      return {
        data: {
          ...data,
          moyasar_status: payment.status,
        },
      }
    } catch (error) {
      return this.buildError("Failed to cancel Moyasar payment", error) as any
    }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const { data, amount } = input
    const moyasarId = data?.moyasar_id as string

    try {
      const refund = await this.moyasarRequest<any>("POST", `/payments/${moyasarId}/refund`, {
        amount: this.toMoyasarAmount(amount as number),
      })

      return {
        data: {
          ...data,
          moyasar_refund_id: refund.id,
          moyasar_status: refund.status,
        },
      }
    } catch (error) {
      return this.buildError("Failed to refund Moyasar payment", error) as any
    }
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    const { data } = input
    const moyasarId = data?.moyasar_id as string

    try {
      const payment = await this.moyasarRequest<any>("GET", `/payments/${moyasarId}`)

      return {
        data: {
          ...data,
          moyasar_status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
        },
      }
    } catch (error) {
      return this.buildError("Failed to retrieve Moyasar payment", error) as any
    }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    return { data: input.data }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return await this.cancelPayment(input)
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const { data } = input
    const moyasarId = data?.moyasar_id as string

    if (!moyasarId) {
      return { status: STATUS.PENDING }
    }

    try {
      const payment = await this.moyasarRequest<any>("GET", `/payments/${moyasarId}`)
      return { status: this.mapStatus(payment.status) }
    } catch (error) {
      this.logger_.error("Failed to get Moyasar payment status", error as Error)
      return { status: STATUS.ERROR }
    }
  }

  /**
   * ⛔ DO NOT fix the payload reading (payload.id -> payload.data.id) on its
   *    own. It must land in the same change as HMAC verification.
   *
   * What is actually happening today: Medusa passes an envelope
   * `{ data, rawData, headers }` (see ProviderWebhookPayload in
   * @medusajs/types), so `payload.id` and `payload.status` are always
   * undefined and every webhook — genuine or forged — exits as
   * "not_supported". That accident is the only thing protecting this path.
   * There is no signature check anywhere in the backend.
   *
   * Correcting the reading alone turns any unauthenticated POST into an
   * accepted payment: a forged body with `status: "paid"` and a session_id
   * lifted from the browser would authorize a payment that never happened —
   * and because the products are digital, the order subscriber emails signed
   * download links immediately. There is no shipping step to catch it.
   *
   * The real payment flow does not depend on this method: authorizePayment
   * verifies server-to-server against Moyasar with the secret key.
   *
   * Prerequisite before touching this: the webhook signing secret from the
   * Moyasar dashboard (no env var for it exists yet) plus the exact signature
   * header name and algorithm from their docs — do not guess either. Both
   * `rawData` and `headers` are already handed to this method, so everything
   * needed to compute and compare the HMAC is in scope.
   */
  async getWebhookActionAndData(
    payload: Record<string, unknown>
  ): Promise<WebhookActionResult> {
    const event = payload as any

    if (!event?.id || !event?.status) {
      return { action: "not_supported" }
    }

    switch (event.status) {
      case "paid":
        return {
          action: "authorized",
          data: {
            session_id: event.metadata?.session_id,
            amount: new BigNumber(Number(event.amount)),
          },
        }
      case "captured":
        return {
          action: "captured",
          data: {
            session_id: event.metadata?.session_id,
            amount: new BigNumber(Number(event.amount)),
          },
        }
      case "failed":
        return {
          action: "failed",
          data: {
            session_id: event.metadata?.session_id,
            amount: new BigNumber(Number(event.amount)),
          },
        }
      default:
        return { action: "not_supported" }
    }
  }
}

export default MoyasarProviderService
