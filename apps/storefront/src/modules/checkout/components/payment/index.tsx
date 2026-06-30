"use client"

import { RadioGroup } from "@headlessui/react"
import { isStripeLike, isMoyasar, paymentInfoMap } from "@lib/constants"
import { initiatePaymentSession } from "@lib/data/cart"
import { CheckCircleSolid, CreditCard } from "@medusajs/icons"
import { Button, Container, Heading, Text, clx } from "@medusajs/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import MoyasarForm from "@modules/checkout/components/moyasar-form"
import PaymentContainer, {
  StripeCardContainer,
} from "@modules/checkout/components/payment-container"
import Divider from "@modules/common/components/divider"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { useLanguage } from "@lib/context/language-context"

const Payment = ({
  cart,
  availablePaymentMethods,
}: {
  cart: any
  availablePaymentMethods: any[]
}) => {
  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (paymentSession: any) => paymentSession.status === "pending"
  )

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardBrand, setCardBrand] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.provider_id ?? ""
  )

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const { lang } = useLanguage()
  const isAR = lang === "ar"

  const isOpen = searchParams.get("step") === "payment"

  const setPaymentMethod = async (method: string) => {
    setError(null)
    setSelectedPaymentMethod(method)
    if (isStripeLike(method)) {
      await initiatePaymentSession(cart, { provider_id: method })
    }
  }

  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  const paymentReady = !!activeSession || paidByGiftcard

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)
      return params.toString()
    },
    [searchParams]
  )

  const handleEdit = () => {
    router.push(pathname + "?" + createQueryString("step", "payment"), {
      scroll: false,
    })
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const shouldInputCard = isStripeLike(selectedPaymentMethod) && !activeSession
      const checkActiveSession = activeSession?.provider_id === selectedPaymentMethod

      if (!checkActiveSession) {
        await initiatePaymentSession(cart, { provider_id: selectedPaymentMethod })
      }

      if (!shouldInputCard) {
        return router.push(
          pathname + "?" + createQueryString("step", "review"),
          { scroll: false }
        )
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  // Hide the empty box on mobile when payment step is not yet reached
  const isEmptyCollapsed = !isOpen && !paymentReady && !paidByGiftcard

  return (
    <div className={clx("bg-white", { "hidden small:block": isEmptyCollapsed })}>
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-baseline",
            { "opacity-50 pointer-events-none select-none": !isOpen && !paymentReady }
          )}
        >
          {isAR ? "الدفع" : "Payment"}
          {!isOpen && paymentReady && <CheckCircleSolid />}
        </Heading>
        {!isOpen && paymentReady && (
          <Text>
            <button
              onClick={handleEdit}
              className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
              data-testid="edit-payment-button"
            >
              {isAR ? "تعديل" : "Edit"}
            </button>
          </Text>
        )}
      </div>

      <div>
        <div className={isOpen ? "block" : "hidden"}>
          {!paidByGiftcard && availablePaymentMethods?.length && (
            <RadioGroup
              value={selectedPaymentMethod}
              onChange={(value: string) => setPaymentMethod(value)}
            >
              {availablePaymentMethods.map((paymentMethod) => (
                <div key={paymentMethod.id}>
                  {isStripeLike(paymentMethod.id) ? (
                    <StripeCardContainer
                      paymentProviderId={paymentMethod.id}
                      selectedPaymentOptionId={selectedPaymentMethod}
                      paymentInfoMap={paymentInfoMap}
                      setCardBrand={setCardBrand}
                      setError={setError}
                      setCardComplete={setCardComplete}
                    />
                  ) : (
                    <PaymentContainer
                      paymentInfoMap={paymentInfoMap}
                      paymentProviderId={paymentMethod.id}
                      selectedPaymentOptionId={selectedPaymentMethod}
                    />
                  )}
                </div>
              ))}
            </RadioGroup>
          )}

          {/* Moyasar.js embedded card form — shows when Moyasar is selected */}
          {isMoyasar(selectedPaymentMethod) && (cart.total ?? 0) > 0 && (
            <MoyasarForm
              amount={cart.total}
              currency={cart.currency_code ?? "SAR"}
            />
          )}

          {paidByGiftcard && (
            <div className="flex flex-col w-full small:w-1/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                {isAR ? "طريقة الدفع" : "Payment method"}
              </Text>
              <Text className="txt-medium text-ui-fg-subtle" data-testid="payment-method-summary">
                {isAR ? "بطاقة هدية" : "Gift card"}
              </Text>
            </div>
          )}

          <ErrorMessage error={error} data-testid="payment-method-error-message" />

          {/* Hide "Continue to Review" for Moyasar — the MPF form has its own submit */}
          {!isMoyasar(selectedPaymentMethod) && (
            <Button
              size="large"
              className="mt-6 w-full small:w-auto"
              onClick={handleSubmit}
              isLoading={isLoading}
              disabled={
                (isStripeLike(selectedPaymentMethod) && !cardComplete) ||
                (!selectedPaymentMethod && !paidByGiftcard)
              }
              data-testid="submit-payment-button"
            >
              {!activeSession && isStripeLike(selectedPaymentMethod)
                ? (isAR ? "أدخل بيانات البطاقة" : "Enter card details")
                : (isAR ? "المتابعة للمراجعة" : "Continue to review")}
            </Button>
          )}
        </div>

        <div className={isOpen ? "hidden" : "block"}>
          {cart && paymentReady && activeSession ? (
            <div className="flex flex-col small:flex-row items-start gap-x-1 gap-y-4 w-full">
              <div className="flex flex-col w-full small:w-1/3">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  {isAR ? "طريقة الدفع" : "Payment method"}
                </Text>
                <Text className="txt-medium text-ui-fg-subtle" data-testid="payment-method-summary">
                  {paymentInfoMap[activeSession?.provider_id]?.title || activeSession?.provider_id}
                </Text>
              </div>
              <div className="flex flex-col w-full small:w-1/3">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  {isAR ? "تفاصيل الدفع" : "Payment details"}
                </Text>
                <div className="flex gap-2 txt-medium text-ui-fg-subtle items-center" data-testid="payment-details-summary">
                  <Container className="flex items-center h-7 w-fit p-2 bg-ui-button-neutral-hover">
                    {paymentInfoMap[selectedPaymentMethod]?.icon || <CreditCard />}
                  </Container>
                  <Text>
                    {isStripeLike(selectedPaymentMethod) && cardBrand
                      ? cardBrand
                      : paymentInfoMap[activeSession?.provider_id]?.title || activeSession?.provider_id}
                  </Text>
                </div>
              </div>
            </div>
          ) : paidByGiftcard ? (
            <div className="flex flex-col w-full small:w-1/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                {isAR ? "طريقة الدفع" : "Payment method"}
              </Text>
              <Text className="txt-medium text-ui-fg-subtle" data-testid="payment-method-summary">
                {isAR ? "بطاقة هدية" : "Gift card"}
              </Text>
            </div>
          ) : null}
        </div>
      </div>
      <Divider className="mt-8" />
    </div>
  )
}

export default Payment
