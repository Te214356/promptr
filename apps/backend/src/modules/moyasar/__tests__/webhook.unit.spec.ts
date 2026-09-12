import MoyasarProviderService from "../service"

/**
 * الثغرة التي وُجدت هذه التجارب لأجلها: مسار الـwebhook كان بلا أي تحقق من
 * المُرسِل، ولم يكن يحميه إلا **عطل ثانٍ** — قراءة خاطئة تجعل كل حدث يخرج
 * بـ`not_supported`. فإصلاح القراءة وحده كان سيحوّل أي `POST` غير موثَّق بجسم
 * فيه `status: "paid"` إلى طلب مكتمل وبريدِ روابط تحميل موقَّعة.
 *
 * ⛔ والمدخلات هنا **مبنية على الشكل الموثَّق من ميسر** — مظروف Medusa
 * `{ data, rawData, headers }` يلفّ جسم ميسر
 * `{ id, type, secret_token, live, data: {…الدفعة…} }` — لا على شكل اخترعته.
 * وهذا فرق جوهري: تجربة تبني مدخلاتها من خيال كاتبها تحرس ارتدادًا ولا تُثبت
 * سلوكًا (انظر قاعدة «افحص من أين تأتي مدخلات التجربة» في CLAUDE.md).
 */

const SECRET = "whsec_a_long_and_random_shared_secret_value"

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

/** مظروف Medusa يلفّ جسم ميسر، بالشكل الموثَّق. */
function envelope(body: Record<string, unknown>) {
  return {
    data: body,
    rawData: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  }
}

function moyasarBody(overrides: Record<string, unknown> = {}) {
  return {
    id: "evt_01ABCDEF",
    type: "payment_paid",
    created_at: "2026-09-12T00:00:00Z",
    secret_token: SECRET,
    account_name: "Promptr",
    live: true,
    data: {
      id: "pay_real_payment_id",
      status: "paid",
      amount: 4900,
      currency: "SAR",
      metadata: { cart_id: "cart_123" },
    },
    ...overrides,
  }
}

describe("Moyasar webhook — تحصين المُرسِل", () => {
  const ORIGINAL = process.env.MOYASAR_WEBHOOK_SECRET

  afterEach(() => {
    if (ORIGINAL === undefined) {
      delete process.env.MOYASAR_WEBHOOK_SECRET
    } else {
      process.env.MOYASAR_WEBHOOK_SECRET = ORIGINAL
    }
  })

  it("يرفض سرًّا مزوَّرًا ولا يمرّره", async () => {
    process.env.MOYASAR_WEBHOOK_SECRET = SECRET
    const { service, logger } = makeService()

    const result = await service.getWebhookActionAndData(
      envelope(moyasarBody({ secret_token: "whsec_forged_by_an_attacker___" })) as any
    )

    expect(result).toEqual({ action: "not_supported" })
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("REJECTED")
    )
  })

  it("يرفض حين لا يُرسَل سرّ إطلاقًا — وهو شكل الطلب المزوَّر الساذج", async () => {
    process.env.MOYASAR_WEBHOOK_SECRET = SECRET
    const { service, logger } = makeService()

    const body = moyasarBody()
    delete (body as any).secret_token

    const result = await service.getWebhookActionAndData(envelope(body) as any)

    expect(result).toEqual({ action: "not_supported" })
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining("REJECTED"))
  })

  it("يرفض حين لا يكون المتغيّر مضبوطًا — فشل مُغلق لا مفتوح", async () => {
    delete process.env.MOYASAR_WEBHOOK_SECRET
    const { service, logger } = makeService()

    // حتى بالسرّ «الصحيح»: بلا متغيّر لا مرجع للمقارنة، فالرفض هو الصواب.
    const result = await service.getWebhookActionAndData(
      envelope(moyasarBody()) as any
    )

    expect(result).toEqual({ action: "not_supported" })
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining("REJECTED"))
  })

  it("يقبل السرّ الصحيح — ويبقى عقيمًا بقرار، لا `authorized`", async () => {
    process.env.MOYASAR_WEBHOOK_SECRET = SECRET
    const { service, logger } = makeService()

    const result = await service.getWebhookActionAndData(
      envelope(moyasarBody()) as any
    )

    // القبول يعني «ثبت أنه من ميسر»، لا «نفّذ». التفعيل محجوب ببند مستقل.
    expect(result).toEqual({ action: "not_supported" })
    expect(logger.error).not.toHaveBeenCalled()
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("intentionally inert")
    )
  })

  it("يسجّل الشكل الوارد كما وصل — أثرٌ يحسم التداخل بدل افتراضه", async () => {
    process.env.MOYASAR_WEBHOOK_SECRET = SECRET
    const { service, logger } = makeService()

    await service.getWebhookActionAndData(envelope(moyasarBody()) as any)

    const line = logger.info.mock.calls.map((c) => String(c[0])).join("\n")
    expect(line).toContain("type=payment_paid")
    expect(line).toContain("resource_id=pay_real_payment_id")
    expect(line).toContain("resource_status=paid")
    expect(line).toContain("nested=yes")
    // ⛔ السرّ لا يُسجَّل أبدًا.
    expect(line).not.toContain(SECRET)
  })

  it("يقرأ الشكل المسطَّح أيضًا — التسامح مقصود لأن ميسر لا تنشر مثال حدث دفع", async () => {
    process.env.MOYASAR_WEBHOOK_SECRET = SECRET
    const { service, logger } = makeService()

    const flat = {
      id: "pay_flat_shape",
      status: "paid",
      amount: 4900,
      secret_token: SECRET,
      type: "payment_paid",
    }

    const result = await service.getWebhookActionAndData(envelope(flat) as any)

    expect(result).toEqual({ action: "not_supported" })
    const line = logger.info.mock.calls.map((c) => String(c[0])).join("\n")
    expect(line).toContain("resource_id=pay_flat_shape")
    expect(line).toContain("nested=no")
  })

  it("يرفض مظروفًا فارغًا بلا أن يرمي", async () => {
    process.env.MOYASAR_WEBHOOK_SECRET = SECRET
    const { service } = makeService()

    await expect(
      service.getWebhookActionAndData({} as any)
    ).resolves.toEqual({ action: "not_supported" })
  })
})
