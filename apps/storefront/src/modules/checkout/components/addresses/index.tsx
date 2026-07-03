"use client"

import { setAddresses } from "@lib/data/cart"
import compareAddresses from "@lib/util/compare-addresses"
import { CheckCircleSolid } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Heading, Text, useToggleState } from "@medusajs/ui"
import Divider from "@modules/common/components/divider"
import Spinner from "@modules/common/icons/spinner"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useActionState } from "react"
import BillingAddress from "../billing_address"
import ErrorMessage from "../error-message"
import ShippingAddress from "../shipping-address"
import { SubmitButton } from "../submit-button"
import { useLanguage } from "@lib/context/language-context"

const Addresses = ({
  cart,
  customer,
  isDigitalOnly = false,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
  isDigitalOnly?: boolean
}) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const { lang } = useLanguage()
  const isAR = lang === "ar"

  const isOpen = searchParams.get("step") === "address"

  const { state: sameAsBilling, toggle: toggleSameAsBilling } = useToggleState(
    cart?.shipping_address && cart?.billing_address
      ? compareAddresses(cart?.shipping_address, cart?.billing_address)
      : true
  )

  const handleEdit = () => {
    router.push(pathname + "?step=address")
  }

  const [message, formAction] = useActionState(setAddresses, null)

  return (
    <div className="rounded-xl border border-white/[0.08] p-4 small:p-6">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className="flex flex-row text-3xl-regular gap-x-2 items-baseline !text-white"
        >
          {isDigitalOnly
            ? (isAR ? "بيانات التواصل" : "Contact Details")
            : (isAR ? "عنوان الشحن" : "Shipping Address")}
          {!isOpen && <CheckCircleSolid />}
        </Heading>
        {!isOpen && cart?.shipping_address && (
          <Text>
            <button
              onClick={handleEdit}
              className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
              data-testid="edit-address-button"
            >
              {isAR ? "تعديل" : "Edit"}
            </button>
          </Text>
        )}
      </div>
      {isOpen ? (
        <form action={formAction}>
          <input type="hidden" name="is_digital" value={isDigitalOnly ? "1" : ""} />
          <div className="pb-8">
            <ShippingAddress
              customer={customer}
              checked={sameAsBilling}
              onChange={toggleSameAsBilling}
              cart={cart}
              isDigitalOnly={isDigitalOnly}
            />

            {!sameAsBilling && (
              <div>
                <Heading
                  level="h2"
                  className="text-3xl-regular gap-x-4 pb-6 pt-8"
                >
                  {isAR ? "عنوان الفاتورة" : "Billing address"}
                </Heading>

                <BillingAddress cart={cart} />
              </div>
            )}
            <SubmitButton className="mt-6 w-full small:w-auto" data-testid="submit-address-button">
              {isDigitalOnly
                ? (isAR ? "المتابعة للدفع" : "Continue to payment")
                : (isAR ? "المتابعة للتوصيل" : "Continue to delivery")}
            </SubmitButton>
            <ErrorMessage error={message} data-testid="address-error-message" />
          </div>
        </form>
      ) : (
        <div>
          <div className="text-small-regular">
            {cart && cart.shipping_address ? (
              <div className="flex items-start gap-x-8">
                <div className="flex flex-col small:flex-row items-start gap-x-1 gap-y-4 w-full">
                  {/* Contact summary — always shown */}
                  <div
                    className="flex flex-col w-full small:w-1/3"
                    data-testid="shipping-contact-summary"
                  >
                    <Text className="txt-medium-plus text-white mb-1">
                      {isAR ? "بيانات التواصل" : "Contact"}
                    </Text>
                    <Text className="txt-medium text-white/60">
                      {cart.shipping_address.first_name}{" "}
                      {cart.shipping_address.last_name}
                    </Text>
                    {cart.shipping_address.phone && (
                      <Text className="txt-medium text-white/60">
                        {cart.shipping_address.phone}
                      </Text>
                    )}
                    <Text className="txt-medium text-white/60">
                      {cart.email}
                    </Text>
                  </div>

                  {/* Shipping address summary — hidden for digital */}
                  {!isDigitalOnly && (
                    <div
                      className="flex flex-col w-full small:w-1/3"
                      data-testid="shipping-address-summary"
                    >
                      <Text className="txt-medium-plus text-white mb-1">
                        {isAR ? "عنوان الشحن" : "Shipping Address"}
                      </Text>
                      <Text className="txt-medium text-white/60">
                        {cart.shipping_address.address_1}{" "}
                        {cart.shipping_address.address_2}
                      </Text>
                      <Text className="txt-medium text-white/60">
                        {cart.shipping_address.postal_code},{" "}
                        {cart.shipping_address.city}
                      </Text>
                      <Text className="txt-medium text-white/60">
                        {cart.shipping_address.country_code?.toUpperCase()}
                      </Text>
                    </div>
                  )}

                  {/* Billing address summary — hidden for digital */}
                  {!isDigitalOnly && (
                    <div
                      className="flex flex-col w-full small:w-1/3"
                      data-testid="billing-address-summary"
                    >
                      <Text className="txt-medium-plus text-white mb-1">
                        {isAR ? "عنوان الفاتورة" : "Billing Address"}
                      </Text>
                      {sameAsBilling ? (
                        <Text className="txt-medium text-white/60">
                          {isAR
                            ? "عنوان الشحن والفاتورة متطابقان."
                            : "Billing and delivery address are the same."}
                        </Text>
                      ) : (
                        <>
                          <Text className="txt-medium text-white/60">
                            {cart.billing_address?.first_name}{" "}
                            {cart.billing_address?.last_name}
                          </Text>
                          <Text className="txt-medium text-white/60">
                            {cart.billing_address?.address_1}{" "}
                            {cart.billing_address?.address_2}
                          </Text>
                          <Text className="txt-medium text-white/60">
                            {cart.billing_address?.postal_code},{" "}
                            {cart.billing_address?.city}
                          </Text>
                          <Text className="txt-medium text-white/60">
                            {cart.billing_address?.country_code?.toUpperCase()}
                          </Text>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <Spinner />
              </div>
            )}
          </div>
        </div>
      )}
      <Divider className="mt-8" />
    </div>
  )
}

export default Addresses
