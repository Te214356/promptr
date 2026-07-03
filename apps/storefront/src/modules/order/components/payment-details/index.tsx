"use client"

import { Text } from "@medusajs/ui"

import { isMoyasar, paymentInfoMap } from "@lib/constants"
import Divider from "@modules/common/components/divider"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { useLanguage } from "@lib/context/language-context"

type PaymentDetailsProps = {
  order: HttpTypes.StoreOrder
}

const PaymentDetails = ({ order }: PaymentDetailsProps) => {
  const payment = order.payment_collections?.[0]?.payments?.[0]
  const { lang } = useLanguage()
  const isAR = lang === "ar"

  const providerInfo = payment
    ? (paymentInfoMap[payment.provider_id] ?? { title: payment.provider_id, icon: null })
    : null

  return (
    <div>
      <h2 className="text-2xl font-semibold text-white mb-6">
        {isAR ? "الدفع" : "Payment"}
      </h2>
      <div>
        {payment && providerInfo && (
          <div className="flex items-start gap-x-6 w-full">
            <div className="flex flex-col w-1/3">
              <Text className="text-sm font-semibold text-white/70 mb-1">
                {isAR ? "طريقة الدفع" : "Payment method"}
              </Text>
              <Text
                className="text-sm text-white/50"
                data-testid="payment-method"
              >
                {providerInfo.title}
              </Text>
            </div>
            <div className="flex flex-col w-2/3">
              <Text className="text-sm font-semibold text-white/70 mb-1">
                {isAR ? "تفاصيل الدفع" : "Payment details"}
              </Text>
              <Text className="text-sm text-white/50" data-testid="payment-amount">
                {isMoyasar(payment.provider_id)
                  ? `${convertToLocale({
                      amount: payment.amount,
                      currency_code: order.currency_code,
                    })} ${isAR ? "دُفع في" : "paid at"} ${new Date(
                      payment.created_at ?? ""
                    ).toLocaleString()}`
                  : `${convertToLocale({
                      amount: payment.amount,
                      currency_code: order.currency_code,
                    })} ${isAR ? "دُفع في" : "paid at"} ${new Date(
                      payment.created_at ?? ""
                    ).toLocaleString()}`}
              </Text>
            </div>
          </div>
        )}
      </div>

      <Divider className="mt-8" />
    </div>
  )
}

export default PaymentDetails
