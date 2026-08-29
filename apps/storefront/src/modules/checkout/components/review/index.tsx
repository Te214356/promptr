"use client"

import { Heading, Text, clx } from "@medusajs/ui"
import PaymentButton from "../payment-button"
import { useSearchParams } from "next/navigation"
import { useLanguage } from "@lib/context/language-context"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

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

const Review = ({ cart }: { cart: any }) => {
  const searchParams = useSearchParams()
  const { lang } = useLanguage()
  const isAR = lang === "ar"

  const isOpen = searchParams.get("step") === "review"

  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  const previousStepsCompleted =
    cart.shipping_address &&
    (cart.payment_collection || paidByGiftcard)

  const isEmptyCollapsed = !isOpen && !previousStepsCompleted

  return (
    <div className={clx("rounded-xl border border-white/[0.08] p-4 small:p-6", { "hidden small:block": isEmptyCollapsed })}>
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-baseline !text-white",
            { "opacity-50 pointer-events-none select-none": !isOpen }
          )}
        >
          {isAR ? "المراجعة" : "Review"}
        </Heading>
      </div>
      {isOpen && previousStepsCompleted && (
        <>
          {/*
            The three policies were plain text here, and the (checkout) layout
            carries no footer — so the buyer was asked to accept policies with
            no way to open them from the page doing the asking. They are links
            now, and they open in a new tab: navigating away mid-checkout would
            abandon a cart that already holds a payment session.
          */}
          <div className="flex items-start gap-x-1 w-full mb-6">
            <div className="w-full">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                {isAR ? (
                  <>
                    بالضغط على زر تأكيد الطلب، فإنك توافق على{" "}
                    <PolicyLink href="/terms">شروط الاستخدام</PolicyLink> و
                    <PolicyLink href="/privacy-policy">سياسة الخصوصية</PolicyLink> و
                    <PolicyLink href="/refund-policy">سياسة الاسترجاع</PolicyLink>{" "}
                    الخاصة بنا.
                  </>
                ) : (
                  <>
                    By clicking the Place Order button, you confirm that you have
                    read, understand and accept our{" "}
                    <PolicyLink href="/terms">Terms of Use</PolicyLink> and{" "}
                    <PolicyLink href="/refund-policy">Refund Policy</PolicyLink>,
                    and acknowledge that you have read Promptr&apos;s{" "}
                    <PolicyLink href="/privacy-policy">Privacy Policy</PolicyLink>.
                  </>
                )}
              </Text>
            </div>
          </div>
          <PaymentButton cart={cart} data-testid="submit-order-button" />
        </>
      )}
    </div>
  )
}

export default Review
