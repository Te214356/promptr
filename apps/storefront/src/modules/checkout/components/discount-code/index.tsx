"use client"

import { Badge, Heading, Label, Text } from "@medusajs/ui"
import React from "react"

import { applyPromotions, type PromotionResult } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import Trash from "@modules/common/icons/trash"
import ErrorMessage from "../error-message"
import { SubmitButton } from "../submit-button"
import { useLanguage } from "@lib/context/language-context"

type DiscountCodeProps = {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
}

/**
 * One message per failure the server action can report.
 *
 * ⛔ Never render the raw error. In production Next replaces the message of any
 * error thrown inside a server action with "An error occurred in the Server
 * Components render...", which is exactly what buyers were being shown here.
 *
 * ⚠️ And "unavailable" is kept separate from "invalid_code" on purpose: a
 * backend outage told as a bad code sends the buyer looking for another code
 * while their real one is fine. Same rule as the payment error ordering.
 */
const REASON_MESSAGES: Record<
  Extract<PromotionResult, { ok: false }>["reason"],
  { ar: string; en: string }
> = {
  invalid_code: {
    ar: "هذا الكود غير صالح، أو انتهت صلاحيته، أو استُخدم من قبل.",
    en: "This code is invalid, expired, or has already been used.",
  },
  no_cart: {
    ar: "انتهت جلسة سلتك. أعد تحميل الصفحة ثم حاول مرة أخرى.",
    en: "Your cart session has expired. Reload the page and try again.",
  },
  unavailable: {
    ar: "تعذّر الوصول إلى الخادم الآن، ولم يُطبَّق الكود. حاول بعد قليل.",
    en: "We could not reach the server, so the code was not applied. Please try again shortly.",
  },
}

const DiscountCode: React.FC<DiscountCodeProps> = ({ cart }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState("")
  const { lang } = useLanguage()
  const isAR = lang === "ar"

  const { promotions = [] } = cart
  const removePromotionCode = async (code: string) => {
    const validPromotions = promotions.filter(
      (promotion) => promotion.code !== code
    )

    await applyPromotions(
      validPromotions.filter((p) => p.code !== undefined).map((p) => p.code!)
    )
  }

  const addPromotionCode = async (formData: FormData) => {
    setErrorMessage("")

    const code = formData.get("code")
    if (!code) {
      return
    }
    const input = document.getElementById("promotion-input") as HTMLInputElement
    const codes = promotions
      .filter((p) => p.code !== undefined)
      .map((p) => p.code!)
    codes.push(code.toString())

    const result = await applyPromotions(codes)

    if (!result.ok) {
      setErrorMessage(REASON_MESSAGES[result.reason][isAR ? "ar" : "en"])
      // The field keeps what was typed: a rejected code is usually a typo, and
      // clearing it forces the buyer to retype the whole thing to fix one
      // character. It is only cleared once a code has actually been applied.
      return
    }

    if (input) {
      input.value = ""
    }
  }

  return (
    <div className="w-full flex flex-col">
      <div className="txt-medium">
        <form action={(a) => addPromotionCode(a)} className="w-full mb-5">
          <Label className="flex gap-x-1 my-2 items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="txt-medium text-white/70 hover:text-white transition-colors"
              data-testid="add-discount-button"
            >
              {isAR ? "إضافة كود خصم" : "Add Promotion Code(s)"}
            </button>
          </Label>

          {isOpen && (
            <>
              <div className="flex w-full gap-x-2">
                <input
                  className="flex-1 bg-white/5 border border-white/40 text-white placeholder-white/60 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-white/60"
                  id="promotion-input"
                  name="code"
                  type="text"
                  autoFocus={false}
                  data-testid="discount-input"
                />
                <SubmitButton
                  variant="secondary"
                  data-testid="discount-apply-button"
                >
                  {isAR ? "تطبيق" : "Apply"}
                </SubmitButton>
              </div>

              <ErrorMessage
                error={errorMessage}
                data-testid="discount-error-message"
              />
            </>
          )}
        </form>

        {promotions.length > 0 && (
          <div className="w-full flex items-center">
            <div className="flex flex-col w-full">
              <Heading className="txt-medium mb-2">
                {isAR ? "الكودات المطبقة:" : "Promotion(s) applied:"}
              </Heading>

              {promotions.map((promotion) => {
                return (
                  <div
                    key={promotion.id}
                    className="flex items-center justify-between w-full max-w-full mb-2"
                    data-testid="discount-row"
                  >
                    <Text className="flex gap-x-1 items-baseline txt-small-plus w-4/5 pr-1">
                      <span className="truncate" data-testid="discount-code">
                        <Badge
                          color={promotion.is_automatic ? "green" : "grey"}
                          size="small"
                        >
                          {promotion.code}
                        </Badge>{" "}
                        (
                        {promotion.application_method?.value !== undefined &&
                          promotion.application_method.currency_code !==
                            undefined && (
                            <>
                              {promotion.application_method.type ===
                              "percentage"
                                ? `${promotion.application_method.value}%`
                                : convertToLocale({
                                    amount: +promotion.application_method.value,
                                    currency_code:
                                      promotion.application_method
                                        .currency_code,
                                  })}
                            </>
                          )}
                        )
                      </span>
                    </Text>
                    {!promotion.is_automatic && (
                      <button
                        className="flex items-center"
                        onClick={() => {
                          if (!promotion.code) {
                            return
                          }

                          removePromotionCode(promotion.code)
                        }}
                        data-testid="remove-discount-button"
                      >
                        <Trash size={14} />
                        <span className="sr-only">
                          {isAR ? "إزالة كود الخصم" : "Remove discount code from order"}
                        </span>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DiscountCode
