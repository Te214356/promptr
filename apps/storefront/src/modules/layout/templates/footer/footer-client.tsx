'use client'
import { useLanguage } from '@lib/context/language-context'
import LocalizedClientLink from '@modules/common/components/localized-client-link'
import PaymentBadges from '@modules/layout/components/payment-badges'
import { HttpTypes } from '@medusajs/types'
import PromptrLogo from '@modules/common/components/promptr-logo'

const WA_NUMBER = "966551859849"
const WA_URL = `https://wa.me/${WA_NUMBER}`
const WA_DISPLAY = "+966 55 185 9849"

const CONTENT = {
  ar: {
    tagline: 'متجرك الرقمي المتكامل',
    description: 'متجر رقمي سعودي متخصص في المنتجات الرقمية وأدوات الذكاء الاصطناعي. نقدم قوالب وأدوات ومحتوى رقمي مختار للسوق العربي.',
    saudiBadge: 'متجر سعودي موثوق 🇸🇦',
    madeBadge: 'صنع في السعودية 🇸🇦❤️',
    freelanceBadge: 'شهادة العمل الحر · مستقل',
    location: 'المملكة العربية السعودية',
    whatsappLabel: 'تواصل واتساب',
    securePayments: 'وسائل الدفع الآمنة',
    protectedMsg: 'مدفوعاتك محمية ومشفرة',
    categoriesTitle: 'التصنيفات',
    collectionsTitle: 'المجموعات',
    storeTitle: 'المتجر',
    allProducts: 'جميع المنتجات',
    account: 'حسابي',
    cart: 'السلة',
    legalLinks: [
      { href: '/refund-policy', label: 'سياسة الاسترجاع' },
      { href: '/privacy-policy', label: 'سياسة الخصوصية' },
      { href: '/terms', label: 'شروط الاستخدام' },
    ],
    copyright: `© ${new Date().getFullYear()} Promptr. جميع الحقوق محفوظة.`,
    bottomRight: 'المملكة العربية السعودية · Saudi Arabia',
  },
  en: {
    tagline: 'Your digital marketplace',
    description: 'A Saudi digital store specializing in digital products and AI tools. We offer curated templates, tools, and digital content for the Arab market.',
    saudiBadge: 'Trusted Saudi Store 🇸🇦',
    madeBadge: 'Made in Saudi Arabia 🇸🇦❤️',
    freelanceBadge: 'Mostaql Verified Freelancer',
    location: 'Saudi Arabia',
    whatsappLabel: 'WhatsApp Support',
    securePayments: 'Secure Payments',
    protectedMsg: 'Your payments are protected & encrypted',
    categoriesTitle: 'Categories',
    collectionsTitle: 'Collections',
    storeTitle: 'Store',
    allProducts: 'All Products',
    account: 'Account',
    cart: 'Cart',
    legalLinks: [
      { href: '/refund-policy', label: 'Refund Policy' },
      { href: '/privacy-policy', label: 'Privacy Policy' },
      { href: '/terms', label: 'Terms of Use' },
    ],
    copyright: `© ${new Date().getFullYear()} Promptr. All rights reserved.`,
    bottomRight: 'Saudi Arabia · المملكة العربية السعودية',
  },
}


interface FooterClientProps {
  collections: HttpTypes.StoreCollection[]
  categories: HttpTypes.StoreProductCategory[]
}

export default function FooterClient({ collections, categories }: FooterClientProps) {
  const { lang } = useLanguage()
  const t = CONTENT[lang]
  const isRTL = lang === 'ar'

  return (
    <footer className="border-t border-white/5 bg-[#080810] w-full">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#6C2BFF]/40 to-transparent" />

      <div className="content-container flex flex-col w-full pt-16 pb-10">

        {/* ── Main columns ─────────────────────────────────────── */}
        <div className="flex flex-col gap-y-10 xsmall:flex-row items-start justify-between mb-14">

          {/* Brand column */}
          <div className="flex flex-col gap-y-3 min-w-[180px] max-w-[260px]">
            <LocalizedClientLink href="/" className="hover:opacity-80 transition-opacity duration-200 w-fit">
              <PromptrLogo size="md" showTagline={true} />
            </LocalizedClientLink>

            <p className="text-white/40 text-xs leading-relaxed">{t.tagline}</p>

            {/* Store description */}
            <p className="text-white/60 text-sm leading-relaxed" dir={isRTL ? 'rtl' : 'ltr'}>
              {t.description}
            </p>

            {/* Badges */}
            <div className="flex flex-col gap-2 mt-1">
              {/* Saudi trusted badge */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium w-fit"
                style={{ background: 'rgba(0,177,64,0.07)', borderColor: 'rgba(0,177,64,0.22)', color: 'rgba(255,255,255,0.55)' }}>
                {t.saudiBadge}
              </span>

            </div>

            {/* Location */}
            <div className="flex items-center gap-1.5 mt-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/20 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              <span className="text-white/20 text-[11px]">{t.location}</span>
            </div>

            {/* WhatsApp */}
            <a
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-1 px-3 py-1.5 rounded-full w-fit transition-all duration-200"
              style={{ background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.22)' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#25D366">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.122 1.526 5.855L.057 23.98l6.278-1.647A11.943 11.943 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
              </svg>
              <span className="text-[#25D366] text-xs font-medium">{t.whatsappLabel}</span>
              <span className="text-white/30 text-[11px]" dir="ltr">{WA_DISPLAY}</span>
            </a>
          </div>

          {/* Links columns */}
          <div className="text-sm gap-10 md:gap-x-16 grid grid-cols-2 sm:grid-cols-3">
            {categories && categories.length > 0 && (
              <div className="flex flex-col gap-y-3">
                <span className="text-white/50 text-xs uppercase tracking-widest font-medium">{t.categoriesTitle}</span>
                <ul className="grid grid-cols-1 gap-2" data-testid="footer-categories">
                  {categories.slice(0, 6).map((c) => {
                    if (c.parent_category) return null
                    return (
                      <li key={c.id}>
                        <LocalizedClientLink
                          className="text-white/40 hover:text-white text-sm transition-colors duration-200"
                          href={`/categories/${c.handle}`}
                          data-testid="category-link"
                        >
                          {c.name}
                        </LocalizedClientLink>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {collections && collections.length > 0 && (
              <div className="flex flex-col gap-y-3">
                <span className="text-white/50 text-xs uppercase tracking-widest font-medium">{t.collectionsTitle}</span>
                <ul className="grid grid-cols-1 gap-2">
                  {collections.slice(0, 6).map((c) => (
                    <li key={c.id}>
                      <LocalizedClientLink
                        className="text-white/40 hover:text-white text-sm transition-colors duration-200"
                        href={`/collections/${c.handle}`}
                      >
                        {c.title}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col gap-y-3">
              <span className="text-white/50 text-xs uppercase tracking-widest font-medium">{t.storeTitle}</span>
              <ul className="grid grid-cols-1 gap-2">
                <li>
                  <LocalizedClientLink className="text-white/40 hover:text-white text-sm transition-colors" href="/store">
                    {t.allProducts}
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink className="text-white/40 hover:text-white text-sm transition-colors" href="/account">
                    {t.account}
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink className="text-white/40 hover:text-white text-sm transition-colors" href="/cart">
                    {t.cart}
                  </LocalizedClientLink>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── Freelance Certificate ─────────────────────────────── */}
        <div className="py-5 border-t border-white/5">
          <div className="flex flex-col items-start gap-1.5 w-fit">
            <div className="rounded-lg overflow-hidden border border-white/10" style={{ padding: '6px', background: 'rgba(255,255,255,0.04)' }}>
              <img
                src="/images/IMG_7737.JPG"
                width={90}
                height={60}
                alt="وثيقة العمل الحر"
                style={{ borderRadius: '6px', display: 'block', objectFit: 'contain' }}
              />
            </div>
            <span className="text-white/25 text-[10px] tracking-widest font-mono">FL-390003756</span>
          </div>
        </div>

        {/* ── Payment strip ─────────────────────────────────────── */}
        <div className="py-6 border-y border-white/5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-white/30 text-[11px] uppercase tracking-widest font-medium">{t.securePayments}</span>
              <PaymentBadges />
            </div>
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6C2BFF" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span className="text-white/30 text-xs">{t.protectedMsg}</span>
            </div>
          </div>
        </div>

        {/* ── Legal links ──────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 py-5 border-b border-white/5">
          {t.legalLinks.map((link) => (
            <LocalizedClientLink
              key={link.href}
              href={link.href}
              className="text-white/30 hover:text-white/60 text-xs transition-colors duration-200"
            >
              {link.label}
            </LocalizedClientLink>
          ))}
        </div>

        {/* ── Bottom bar ───────────────────────────────────────────── */}
        <div className="flex flex-wrap w-full mt-5 justify-between items-center gap-3">
          <span className="text-white/20 text-xs">{t.copyright}</span>
          <div className="flex items-center gap-3">
            <span className="text-white/15 text-xs">{t.bottomRight}</span>
            <span className="text-white/10 text-xs">promptrsa.com</span>
          </div>
        </div>

        {/* ── Made in Saudi ────────────────────────────────────────── */}
        <div className="flex justify-center pt-5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium"
            style={{ background: 'rgba(108,43,255,0.07)', borderColor: 'rgba(108,43,255,0.22)', color: 'rgba(255,255,255,0.5)' }}>
            {t.madeBadge}
          </span>
        </div>
      </div>
    </footer>
  )
}
