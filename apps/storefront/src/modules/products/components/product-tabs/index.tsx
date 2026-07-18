"use client"

import Back from "@modules/common/icons/back"
import FastDelivery from "@modules/common/icons/fast-delivery"
import Refresh from "@modules/common/icons/refresh"

import Accordion from "./accordion"
import { HttpTypes } from "@medusajs/types"
import { useLanguage } from "@lib/context/language-context"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
}

const ProductTabs = ({ product }: ProductTabsProps) => {
  const { lang } = useLanguage()
  const isAR = lang === "ar"

  const tabs = [
    {
      label: isAR ? "معلومات المنتج" : "Product Information",
      component: <ProductInfoTab product={product} />,
    },
    {
      label: isAR ? "سياسة الاسترجاع" : "Shipping & Returns",
      component: <ShippingInfoTab />,
    },
  ]

  return (
    <div className="w-full">
      <Accordion type="multiple">
        {tabs.map((tab, i) => (
          <Accordion.Item
            key={i}
            title={tab.label}
            headingSize="medium"
            value={tab.label}
          >
            {tab.component}
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  )
}

const ProductInfoTab = ({ product }: ProductTabsProps) => {
  const { lang } = useLanguage()
  const isAR = lang === "ar"

  if (!product.description && !product.type) {
    return (
      <div className="text-small-regular py-8">
        <p className="text-ui-fg-subtle">
          {isAR ? "لا توجد معلومات إضافية." : "No additional information."}
        </p>
      </div>
    )
  }

  return (
    <div className="text-small-regular py-8">
      <div className="flex flex-col gap-y-4">
        {product.description && (
          <p className="whitespace-pre-line">{product.description}</p>
        )}
        {product.type && (
          <div>
            <span className="font-semibold">{isAR ? "النوع" : "Type"}</span>
            <p>{product.type.value}</p>
          </div>
        )}
      </div>
    </div>
  )
}

const ShippingInfoTab = () => {
  const { lang } = useLanguage()
  const isAR = lang === "ar"

  return (
    <div className="text-small-regular py-8">
      <div className="grid grid-cols-1 gap-y-8">
        <div className="flex items-start gap-x-2">
          <FastDelivery />
          <div>
            <span className="font-semibold">
              {isAR ? "تسليم فوري" : "Instant delivery"}
            </span>
            <p className="max-w-sm">
              {isAR
                ? "منتجاتنا رقمية — تصلك فوراً بعد اكتمال الدفع."
                : "Our products are digital — delivered instantly after payment."}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-x-2">
          <Refresh />
          <div>
            <span className="font-semibold">
              {isAR ? "استبدال سهل" : "Simple exchanges"}
            </span>
            <p className="max-w-sm">
              {isAR
                ? "لديك مشكلة في ملف التنزيل؟ سنُعيد إرساله فوراً."
                : "Problem with your download file? We'll resend it immediately."}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-x-2">
          <Back />
          <div>
            <span className="font-semibold">
              {isAR ? "استرداد سهل" : "Easy returns"}
            </span>
            <p className="max-w-sm">
              {isAR
                ? "راجع سياسة الاسترجاع لدينا. نحن نسعى لرضاك التام."
                : "Check our refund policy. We strive for your complete satisfaction."}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductTabs
