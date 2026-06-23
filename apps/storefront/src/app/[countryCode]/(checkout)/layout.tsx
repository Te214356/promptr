'use client'
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"
import PaymentBadges from "@modules/layout/components/payment-badges"
import { useLanguage } from "@lib/context/language-context"

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  const { lang } = useLanguage()
  const isRTL = lang === 'ar'

  return (
    <div className="w-full bg-[#080810] relative small:min-h-screen">
      <div className="h-16 bg-[#080810] border-b border-white/5">
        <nav className="flex h-full items-center content-container justify-between">
          <LocalizedClientLink
            href="/cart"
            className="text-white/50 hover:text-white text-sm flex items-center gap-x-2 flex-1 basis-0 transition-colors duration-200"
            data-testid="back-to-cart-link"
          >
            <ChevronDown className="rotate-90 text-white/40" size={16} />
            <span className="mt-px hidden small:block">
              {isRTL ? 'العودة للسلة' : 'Back to cart'}
            </span>
            <span className="mt-px block small:hidden">
              {isRTL ? 'عودة' : 'Back'}
            </span>
          </LocalizedClientLink>

          <LocalizedClientLink
            href="/"
            className="font-bold text-lg tracking-widest text-white hover:text-[#00CFFF] uppercase transition-colors duration-200"
            data-testid="store-link"
          >
            Promptr
          </LocalizedClientLink>

          <div className="flex-1 basis-0 flex justify-end items-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00CFFF" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className="text-white/30 text-xs hidden small:block">
              {isRTL ? 'دفع آمن' : 'Secure Checkout'}
            </span>
          </div>
        </nav>
      </div>

      <div className="relative" data-testid="checkout-container">{children}</div>

      <div className="py-6 border-t border-white/5 bg-[#080810]">
        <div className="content-container flex flex-col sm:flex-row items-center justify-center gap-4">
          <span className="text-white/20 text-xs">
            {isRTL ? 'وسائل الدفع المقبولة:' : 'Accepted payment methods:'}
          </span>
          <PaymentBadges compact />
        </div>
      </div>
    </div>
  )
}
