import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Checkout",
}

const ERROR_MESSAGES: Record<string, string> = {
  payment_failed:
    "فشل الدفع — يرجى التحقق من بيانات البطاقة والمحاولة مرة أخرى. / Payment failed — please check your card details and try again.",
  session_update_failed:
    "خطأ في تهيئة الدفع — يرجى المحاولة مرة أخرى. / Payment initialization error — please try again.",
  order_failed:
    "فشل إنشاء الطلب — يرجى التواصل مع الدعم. / Order creation failed — please contact support.",
}

type Props = {
  searchParams: Promise<{ step?: string; error?: string }>
}

export default async function Checkout({ searchParams }: Props) {
  const { error } = await searchParams
  const errorMessage = error
    ? (ERROR_MESSAGES[error] ?? "حدث خطأ في عملية الدفع — يرجى المحاولة مرة أخرى. / A payment error occurred — please try again.")
    : null

  const [cart, customer] = await Promise.all([
    retrieveCart(),
    retrieveCustomer(),
  ])

  if (!cart) {
    return notFound()
  }

  return (
    <>
      {errorMessage && (
        <div className="content-container pt-6 small:pt-12">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-center">
            <p className="text-red-400 text-sm font-medium">{errorMessage}</p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 small:grid-cols-[1fr_416px] content-container gap-x-40 py-6 small:py-12">
        <PaymentWrapper cart={cart}>
          <CheckoutForm cart={cart} customer={customer} />
        </PaymentWrapper>
        <CheckoutSummary cart={cart} />
      </div>
    </>
  )
}
