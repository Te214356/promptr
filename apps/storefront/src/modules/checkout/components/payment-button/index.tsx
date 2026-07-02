"use client"

import { isManual, isMoyasar } from "@lib/constants"
import { placeOrder } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import React, { useState } from "react"
import ErrorMessage from "../error-message"
import { useLanguage } from "@lib/context/language-context"

type PaymentButtonProps = {
  cart: HttpTypes.StoreCart
  "data-testid": string
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  cart,
  "data-testid": dataTestId,
}) => {
  const { lang } = useLanguage()
  const isAR = lang === "ar"

  const notReady =
    !cart ||
    !cart.shipping_address ||
    !cart.billing_address ||
    !cart.email

  const paymentSession = cart.payment_collection?.payment_sessions?.[0]

  switch (true) {
    case isMoyasar(paymentSession?.provider_id):
      return (
        <MoyasarPaymentButton notReady={notReady} data-testid={dataTestId} />
      )
    case isManual(paymentSession?.provider_id):
      return (
        <ManualTestPaymentButton notReady={notReady} data-testid={dataTestId} />
      )
    default:
      return <Button disabled>{isAR ? "اختر طريقة الدفع" : "Select a payment method"}</Button>
  }
}

const MoyasarPaymentButton = ({
  notReady,
  "data-testid": dataTestId,
}: {
  notReady: boolean
  "data-testid"?: string
}) => {
  const { lang } = useLanguage()
  const isAR = lang === "ar"
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handlePayment = async () => {
    setSubmitting(true)
    await placeOrder()
      .catch((err) => { setErrorMessage(err.message) })
      .finally(() => { setSubmitting(false) })
  }

  return (
    <>
      <Button
        disabled={notReady}
        isLoading={submitting}
        onClick={handlePayment}
        size="large"
        className="w-full small:w-auto"
        data-testid={dataTestId}
      >
        {isAR ? "تأكيد الطلب" : "Place order"}
      </Button>
      <ErrorMessage error={errorMessage} data-testid="moyasar-payment-error-message" />
    </>
  )
}

const ManualTestPaymentButton = ({
  notReady,
  "data-testid": dataTestId,
}: {
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { lang } = useLanguage()
  const isAR = lang === "ar"

  const handlePayment = () => {
    setSubmitting(true)
    placeOrder()
      .catch((err) => { setErrorMessage(err.message) })
      .finally(() => { setSubmitting(false) })
  }

  return (
    <>
      <Button
        disabled={notReady}
        isLoading={submitting}
        onClick={handlePayment}
        size="large"
        className="w-full small:w-auto"
        data-testid="submit-order-button"
      >
        {isAR ? "تأكيد الطلب" : "Place order"}
      </Button>
      <ErrorMessage error={errorMessage} data-testid="manual-payment-error-message" />
    </>
  )
}

export default PaymentButton
