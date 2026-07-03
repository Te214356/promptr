"use client"

import { isMoyasar } from "@lib/constants"
import { initiatePaymentSession } from "@lib/data/cart"
import { CheckCircleSolid } from "@medusajs/icons"
import { Button, Heading, Text, clx } from "@medusajs/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import MoyasarForm from "@modules/checkout/components/moyasar-form"
import Divider from "@modules/common/components/divider"
import Spinner from "@modules/common/icons/spinner"
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
    (s: any) => s.status === "pending"
  )

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [moyasarReady, setMoyasarReady] = useState(
    isMoyasar(activeSession?.provider_id) && !!activeSession
  )

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const { lang } = useLanguage()
  const isAR = lang === "ar"

  const isOpen = searchParams.get("step") === "payment"
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

  // Auto-initiate Moyasar session when payment step opens
  useEffect(() => {
    if (!isOpen || moyasarReady || isLoading) return

    const moyasarMethod = availablePaymentMethods?.find((m) => isMoyasar(m.id))
    if (!moyasarMethod) return

    setIsLoading(true)
    setError(null)
    initiatePaymentSession(cart, { provider_id: moyasarMethod.id })
      .then(() => setMoyasarReady(true))
      .catch((err: any) => setError(err.message ?? "فشل تهيئة الدفع"))
      .finally(() => setIsLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  useEffect(() => {
    setError(null)
  }, [isOpen])

  const isEmptyCollapsed = !isOpen && !paymentReady && !paidByGiftcard

  return (
    <div className={clx("rounded-xl border border-white/[0.08] p-4 small:p-6", { "hidden small:block": isEmptyCollapsed })}>
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-baseline !text-white",
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
            >
              {isAR ? "تعديل" : "Edit"}
            </button>
          </Text>
        )}
      </div>

      <div className={isOpen ? "block" : "hidden"}>
        {isLoading && (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        )}

        {!isLoading && moyasarReady && (
          <MoyasarForm
            amount={cart.total ?? 0}
            currency={cart.currency_code ?? "sar"}
          />
        )}

        <ErrorMessage error={error} data-testid="payment-method-error-message" />

        {!isLoading && error && (
          <Button
            size="large"
            className="mt-4 w-full small:w-auto"
            onClick={() => {
              setError(null)
              setMoyasarReady(false)
            }}
          >
            {isAR ? "إعادة المحاولة" : "Retry"}
          </Button>
        )}
      </div>

      <div className={isOpen ? "hidden" : "block"}>
        {paymentReady && (
          <Text className="txt-medium text-ui-fg-subtle">
            {isAR ? "جاهز للدفع" : "Ready to pay"}
          </Text>
        )}
      </div>

      <Divider className="mt-8" />
    </div>
  )
}

export default Payment
