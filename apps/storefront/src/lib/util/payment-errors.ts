/**
 * One vocabulary for every way a Moyasar payment can fail, so the buyer always
 * gets a sentence they can act on instead of a red button.
 *
 * ## Why the card form was silent
 *
 * MPF 1.14 does compute an error message — but the credit-card renderer never
 * shows it. Its failure handler stores the text in component state (`kn`) and
 * fires it through the `on_failure` callback, while `render()` reads only
 * `busy / success / fail / disabled`. The STC Pay renderer reads `kn`; the card
 * renderer does not. So a declined card paints the pay button red for three
 * seconds (`mysr-form-fail`, cleared by a 3s timer) and drops the reason on the
 * floor. `on_failure` is the only way to get that text onto the page.
 *
 * ## The two places a failure can surface
 *
 * | Failure | Where it lands |
 * |---|---|
 * | Declined with no 3-D Secure, network, card-data rejected, config | `on_failure` in the form — no redirect happens |
 * | 3-D Secure failed or was abandoned | `/checkout/moyasar-callback?status=failed&message=…` |
 *
 * Both go through `classifyPaymentError`, so the same failure reads the same way
 * wherever the buyer meets it.
 *
 * ## What arrives here
 *
 * Whatever MPF hands `on_failure`, or whatever Moyasar puts in the callback's
 * `message` query param. It is never a stable code:
 *   - the acquirer's own English text (`payment.source.message`) — "Insufficient
 *     funds", "Do not honor", "3-D Secure authentication failed", …
 *   - MPF's own localised strings, in Arabic or English depending on the
 *     `language` we passed at init ("Network Error" / "خطأ في محاولة الاتصال")
 *   - an Error, a Response, or null, from the paths that never got a payment
 *
 * So this matches on substrings and always falls through to `unexpected`. The
 * raw value is never shown — callers log it with `console.error` instead.
 */

export type PaymentErrorCode =
  | "card_declined"
  | "three_ds_failed"
  | "session_expired"
  | "network"
  | "unexpected"

type Lang = "ar" | "en"

/**
 * Buyer-facing copy. Two rules held deliberately:
 *
 * 1. No gateway text, no status codes, no `error.digest` — the raw detail goes
 *    to `console.error` for us, never to the screen.
 * 2. "لم يُخصم أي مبلغ" appears only where it is certainly true: a declined card
 *    and a failed 3-D Secure both leave the payment in `failed`, never captured.
 *    It is absent from `unexpected`, which also covers failures *after* Moyasar
 *    confirmed the charge — promising "no charge" there would be a lie.
 */
const MESSAGES: Record<PaymentErrorCode, Record<Lang, string>> = {
  card_declined: {
    ar: "لم تُقبل البطاقة. تأكد من رقم البطاقة وتاريخ انتهائها ورمز الأمان ومن توفر رصيد كافٍ، أو جرّب بطاقة أخرى. لم يُخصم أي مبلغ.",
    en: "The card was not accepted. Check the card number, expiry date, security code and available balance, or try another card. You have not been charged.",
  },
  three_ds_failed: {
    ar: "لم يكتمل التحقق من بنكك (3D Secure). لم يُخصم أي مبلغ. أعد المحاولة وأدخل رمز التحقق الذي يصلك من البنك قبل انتهاء مهلته.",
    en: "Your bank's verification (3-D Secure) was not completed. You have not been charged. Try again and enter the code your bank sends you before it expires.",
  },
  session_expired: {
    ar: "انتهت صلاحية جلسة الدفع. أعد تحميل الصفحة وابدأ عملية الدفع من جديد.",
    en: "The payment session has expired. Reload the page and start the payment again.",
  },
  network: {
    ar: "تعذّر الوصول إلى بوابة الدفع. تحقق من اتصالك بالإنترنت ثم أعد المحاولة.",
    en: "We could not reach the payment gateway. Check your internet connection and try again.",
  },
  unexpected: {
    ar: "تعذّر إتمام عملية الدفع لسبب غير متوقع. أعد المحاولة، وإن تكرر الأمر تواصل معنا وأخبرنا بوقت المحاولة.",
    en: "The payment could not be completed for an unexpected reason. Please try again, and if it happens again contact us with the time you tried.",
  },
}

/**
 * Ordered, and the order carries meaning — the first match wins. Every ordering
 * decision below came from a case that landed in the wrong bucket:
 *
 * - MPF's own `authentication_error` reads "Authentication error, service is
 *   unavailable now" — that is Moyasar being unreachable, not a 3-D Secure
 *   failure, so the "service is unavailable" rule is tested before the 3DS one.
 * - 3DS text usually also carries a decline word, so 3DS beats `card_declined`.
 * - "expired card" is a decline, not an expired session, so `card_declined`
 *   beats `session_expired`.
 * - `refus` is anchored with \b: without it "ECONNREFUSED" read as a refused
 *   card instead of a dead connection.
 */
const PATTERNS: ReadonlyArray<readonly [PaymentErrorCode, RegExp]> = [
  [
    "network",
    /service\s*is\s*unavailable|خدمة\s*الدفع\s*غير\s*متوفرة/i,
  ],
  [
    "three_ds_failed",
    /3-?\s?d[-\s]?secure|three[-\s]?ds|\b3ds\b|authentication\s*(failed|error|required|declined)|not\s*authenticated|التحقق\s*الثلاثي/i,
  ],
  [
    "card_declined",
    /declin|do\s*not\s*honou?r|insufficient|not\s*sufficient|restricted|stolen|lost\s*card|pick[-\s]?up\s*card|expired\s*card|invalid\s*card|card\s*(is\s*)?(not\s*)?(valid|supported|allowed)|unsupported|exceed|issuer|\brefus|\brejected/i,
  ],
  [
    "card_declined",
    /بطاقة|رصيد/,
  ],
  [
    "session_expired",
    /session\s*(has\s*)?(expired|not\s*found|invalid)|expired\s*session|invalid[_\s]?token|otp\s*time|انتهت\s*(صلاحية|الجلسة)|الوقت\s*المسموح/i,
  ],
  [
    "network",
    /network|timed?\s*out|timeout|fetch\s*failed|failed\s*to\s*fetch|load\s*failed|unreachable|connection|econn(reset|refused|aborted)|enotfound|socket|\b50[234]\b|محاولة\s*الات?صال|الإتصال/i,
  ],
]

/** Pulls a searchable string out of whatever the failure path handed us. */
function toText(raw: unknown): string {
  if (typeof raw === "string") return raw
  if (raw instanceof Error) return `${raw.name}: ${raw.message}`
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, any>
    const parts = [o.message, o.type, o.status, o.source?.message, o.statusText]
      .filter((p) => typeof p === "string" || typeof p === "number")
      .join(" ")
    if (parts.trim()) return parts
    // A Response, or anything else without readable fields — the caller logs the
    // object itself, so an empty string here just means "fall through".
    return ""
  }
  return ""
}

export function classifyPaymentError(raw: unknown): PaymentErrorCode {
  const text = toText(raw)
  if (!text.trim()) return "unexpected"

  for (const [code, pattern] of PATTERNS) {
    if (pattern.test(text)) return code
  }
  return "unexpected"
}

export function paymentErrorMessage(
  code: PaymentErrorCode,
  lang: Lang = "ar"
): string {
  return MESSAGES[code][lang]
}
