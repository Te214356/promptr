"use client"

import { Heading, Text, clx } from "@medusajs/ui"
import PaymentButton from "../payment-button"
import { useSearchParams } from "next/navigation"
import { useLanguage } from "@lib/context/language-context"

const Review = ({ cart }: { cart: any }) => {
  const searchParams = useSearchParams()
  const { lang } = useLanguage()
  const isAR = lang === "ar"

  const isOpen = searchParams.get("step") === "review"

  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  // Removed cart.shipping_methods.length > 0 — digital products have no shipping methods
  const previousStepsCompleted =
    cart.shipping_address &&
    (cart.payment_collection || paidByGiftcard)

  // Hide empty box on mobile when review step is not yet reached
  const isEmptyCollapsed = !isOpen && !previousStepsCompleted

  return (
    <div className={clx("bg-white", { "hidden small:block": isEmptyCollapsed })}>
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-baseline",
            { "opacity-50 pointer-events-none select-none": !isOpen }
          )}
        >
          {isAR ? "المراجعة" : "Review"}
        </Heading>
      </div>
      {isOpen && previousStepsCompleted && (
        <>
          <div className="flex items-start gap-x-1 w-full mb-6">
            <div className="w-full">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                {isAR
                  ? "بالضغط على زر تأكيد الطلب، فإنك توافق على شروط الاستخدام وسياسة الخصوصية وسياسة الاسترجاع الخاصة بنا."
                  : "By clicking the Place Order button, you confirm that you have read, understand and accept our Terms of Use, Terms of Sale and Returns Policy and acknowledge that you have read Promptr's Privacy Policy."}
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
