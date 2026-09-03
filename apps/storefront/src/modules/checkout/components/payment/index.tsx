"use client"

import { isMoyasar } from "@lib/constants"
import { CheckCircleSolid } from "@medusajs/icons"
import { Button, Heading, Text, clx } from "@medusajs/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import MoyasarForm from "@modules/checkout/components/moyasar-form"
import Divider from "@modules/common/components/divider"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { useLanguage } from "@lib/context/language-context"

/**
 * The policies the buyer accepts by paying. Links, not prose: the (checkout)
 * layout renders no footer, so this is the only route to them from the page
 * that asks for consent. They open in a new tab — navigating away would
 * abandon a cart that already holds a payment session.
 */
const PolicyLink = ({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) => (
  <LocalizedClientLink
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="text-[#00CFFF] hover:text-[#00CFFF]/70 underline underline-offset-4 transition-colors"
  >
    {children}
  </LocalizedClientLink>
)

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

  const [error, setError] = useState<string | null>(null)
  const [moyasarReady, setMoyasarReady] = useState(false)

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const { lang } = useLanguage()
  const isAR = lang === "ar"

  const isOpen = searchParams.get("step") === "payment"
  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0
  const paymentReady = moyasarReady || !!activeSession || paidByGiftcard

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

  // Show Moyasar form immediately when payment step opens — no Medusa session needed until
  // after payment. The session is created in the callback page with the verified moyasar_id,
  // avoiding duplicate sessions that break cart.complete().
  useEffect(() => {
    if (!isOpen || moyasarReady) return
    const hasMoyasar = availablePaymentMethods?.some((m) => isMoyasar(m.id))
    if (hasMoyasar) setMoyasarReady(true)
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
        {/*
          Consent sits here, immediately above the card fields, because this is
          where payment actually happens: the Moyasar form submits straight to
          the gateway and returns through /checkout/moyasar-callback. It used to
          live in the Review section, which nothing ever opened — no code
          anywhere set ?step=review — so the buyer paid without this line ever
          being rendered. Keep it above the form; below the fold of the card
          inputs is not "before paying".
        */}
        {moyasarReady && (
          <Text className="txt-medium text-ui-fg-subtle mb-4">
            {isAR ? (
              <>
                بإتمام الدفع، فإنك توافق على{" "}
                <PolicyLink href="/terms">شروط الاستخدام</PolicyLink> و
                <PolicyLink href="/privacy-policy">سياسة الخصوصية</PolicyLink> و
                <PolicyLink href="/refund-policy">سياسة الاسترجاع</PolicyLink>{" "}
                الخاصة بنا.
              </>
            ) : (
              <>
                By completing this payment, you confirm that you have read,
                understand and accept our{" "}
                <PolicyLink href="/terms">Terms of Use</PolicyLink> and{" "}
                <PolicyLink href="/refund-policy">Refund Policy</PolicyLink>, and
                acknowledge that you have read Promptr&apos;s{" "}
                <PolicyLink href="/privacy-policy">Privacy Policy</PolicyLink>.
              </>
            )}
          </Text>
        )}

        {moyasarReady && (
          <MoyasarForm
            amount={cart.total ?? 0}
            currency={cart.currency_code ?? "sar"}
            cartId={cart.id}
          />
        )}

        <ErrorMessage error={error} data-testid="payment-method-error-message" />

        {error && (
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
