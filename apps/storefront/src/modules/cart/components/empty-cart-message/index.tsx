'use client'
import { useLanguage } from '@lib/context/language-context'
import LocalizedClientLink from '@modules/common/components/localized-client-link'

const CONTENT = {
  ar: {
    title: 'سلتك فارغة',
    body: 'لم تُضف أي منتج بعد. تصفّح المنتجات الرقمية واختر ما يناسبك — التحميل فوري بعد الشراء.',
    cta: 'استكشف المتجر',
    secondary: 'اقرأ المدونة',
  },
  en: {
    title: 'Your cart is empty',
    body: "You haven't added anything yet. Browse the digital products and pick what fits — download is instant after checkout.",
    cta: 'Explore the store',
    secondary: 'Read the blog',
  },
}

const EmptyCartMessage = () => {
  const { lang } = useLanguage()
  const t = CONTENT[lang]

  return (
    <div
      className="flex flex-col items-center gap-y-6 rounded-3xl border border-white/10 bg-[#0d0d1f] px-6 py-20 text-center"
      data-testid="empty-cart-message"
    >
      <span
        className="flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(108,43,255,0.28), transparent 70%)' }}
        aria-hidden="true"
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#00CFFF" strokeWidth="1.5">
          <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.2a1 1 0 0 0 1-.8L19 7H6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="9" cy="20" r="1.4" />
          <circle cx="17" cy="20" r="1.4" />
        </svg>
      </span>

      <div className="flex flex-col gap-y-3">
        <h1 className="text-2xl font-bold text-white small:text-3xl">{t.title}</h1>
        <p className="mx-auto max-w-[34rem] text-sm leading-relaxed text-white/50 small:text-base">
          {t.body}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <LocalizedClientLink
          href="/store"
          className="rounded-full bg-[#6C2BFF] px-8 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-[#5a22dd] hover:shadow-[0_0_40px_rgba(108,43,255,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00CFFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d1f]"
          data-testid="empty-cart-store-link"
        >
          {t.cta}
        </LocalizedClientLink>
        <LocalizedClientLink
          href="/blog"
          className="rounded-full border border-white/15 px-8 py-3 text-sm font-medium text-white/80 transition-all duration-200 hover:border-[#6C2BFF]/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00CFFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d1f]"
        >
          {t.secondary}
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default EmptyCartMessage
