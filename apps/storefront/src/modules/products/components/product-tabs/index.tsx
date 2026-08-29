"use client"

import FastDelivery from "@modules/common/icons/fast-delivery"
import Package from "@modules/common/icons/package"
import Refresh from "@modules/common/icons/refresh"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

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
        {/*
          This tab used to promise "easy returns" and "simple exchanges", which
          contradicted the published policy outright: it states that once a
          digital product is delivered it cannot be returned or refunded. The
          buyer read the softer promise at the moment of deciding. The wording
          below mirrors /refund-policy — keep the two in step, and keep
          `returnPolicyCategory` in product-jsonld in step with both.
        */}
        <div className="flex items-start gap-x-2">
          <Package />
          <div>
            <span className="font-semibold">
              {isAR
                ? "منتج رقمي غير قابل للاسترجاع"
                : "Digital product — non-returnable"}
            </span>
            <p className="max-w-sm">
              {isAR
                ? "بمجرد تسليم المنتج أو الإفصاح عن محتواه، لا يمكن إرجاعه أو استرداد قيمته."
                : "Once the product is delivered or its content disclosed, it cannot be returned or refunded."}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-x-2">
          <Refresh />
          <div>
            <span className="font-semibold">
              {isAR ? "متى نستردّ المبلغ" : "When we do refund"}
            </span>
            <p className="max-w-sm">
              {isAR
                ? "إن كان الملف تالفاً أو غير مكتمل، أو لم يطابق الوصف بشكل جوهري، أو تكرّر خصم المبلغ، أو لم يصلك خلال 24 ساعة من الدفع."
                : "If the file is corrupted or incomplete, materially differs from its description, you were charged twice, or it was not delivered within 24 hours of payment."}
            </p>
            <LocalizedClientLink
              href="/refund-policy"
              className="text-[#00CFFF] hover:text-[#00CFFF]/70 underline underline-offset-4 mt-2 inline-block transition-colors"
            >
              {isAR
                ? "اقرأ سياسة الاسترجاع كاملة"
                : "Read the full refund policy"}
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductTabs
