import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PaymentBadges from "@modules/layout/components/payment-badges"

const LEGAL_LINKS = [
  { href: "/privacy-policy", labelAr: "سياسة الخصوصية", labelEn: "Privacy Policy" },
  { href: "/terms-of-use", labelAr: "شروط الاستخدام", labelEn: "Terms of Use" },
  { href: "/return-policy", labelAr: "سياسة الاسترجاع", labelEn: "Return Policy" },
]

export default async function Footer() {
  const { collections } = await listCollections({ fields: "*products" })
  const productCategories = await listCategories()

  return (
    <footer className="border-t border-white/5 bg-[#080810] w-full">
      {/* Top gradient rule */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#6C2BFF]/40 to-transparent" />

      <div className="content-container flex flex-col w-full pt-16 pb-10">

        {/* ── Main columns ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-y-10 xsmall:flex-row items-start justify-between mb-14">
          {/* Brand column */}
          <div className="flex flex-col gap-y-3 min-w-[160px]">
            <LocalizedClientLink
              href="/"
              className="font-bold text-2xl tracking-widest text-white hover:text-[#00CFFF] transition-colors duration-200 uppercase"
            >
              Promptr
            </LocalizedClientLink>
            <p className="text-white/30 text-xs leading-relaxed" dir="rtl" lang="ar">
              متجرك الرقمي المتكامل
            </p>
            <p className="text-white/20 text-xs">Your digital marketplace</p>

            {/* Saudi badge */}
            <div className="flex items-center gap-2 mt-2">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium"
                style={{
                  background: "rgba(0, 177, 64, 0.08)",
                  borderColor: "rgba(0, 177, 64, 0.25)",
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                🇸🇦 متجر سعودي موثوق
              </span>
            </div>

            {/* Location */}
            <div className="flex items-center gap-1.5 mt-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/20">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              <span className="text-white/20 text-[11px]">المملكة العربية السعودية</span>
            </div>
          </div>

          {/* Links columns */}
          <div className="text-sm gap-10 md:gap-x-16 grid grid-cols-2 sm:grid-cols-3">
            {productCategories && productCategories.length > 0 && (
              <div className="flex flex-col gap-y-3">
                <span className="text-white/50 text-xs uppercase tracking-widest font-medium">Categories</span>
                <ul className="grid grid-cols-1 gap-2" data-testid="footer-categories">
                  {productCategories.slice(0, 6).map((c) => {
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
                <span className="text-white/50 text-xs uppercase tracking-widest font-medium">Collections</span>
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
              <span className="text-white/50 text-xs uppercase tracking-widest font-medium">Store</span>
              <ul className="grid grid-cols-1 gap-2">
                <li>
                  <LocalizedClientLink className="text-white/40 hover:text-white text-sm transition-colors duration-200" href="/store">
                    All Products
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink className="text-white/40 hover:text-white text-sm transition-colors duration-200" href="/account">
                    Account
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink className="text-white/40 hover:text-white text-sm transition-colors duration-200" href="/cart">
                    Cart
                  </LocalizedClientLink>
                </li>
                {/* WhatsApp link in nav column */}
                <li>
                  <a
                    href="https://wa.me/966500000000"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[#25D366]/70 hover:text-[#25D366] text-sm transition-colors duration-200"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.122 1.526 5.855L.057 23.98l6.278-1.647A11.943 11.943 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.88 9.88 0 0 1-5.034-1.375l-.361-.214-3.727.977.997-3.634-.235-.373A9.855 9.855 0 0 1 2.106 12C2.106 6.533 6.533 2.106 12 2.106S21.894 6.533 21.894 12 17.467 21.894 12 21.894z" />
                    </svg>
                    <span dir="rtl" lang="ar">واتساب</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── Payment trust strip ───────────────────────────────────── */}
        <div className="py-6 border-y border-white/5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-white/30 text-[11px] uppercase tracking-widest font-medium">
                Secure Payments / وسائل الدفع الآمنة
              </span>
              <PaymentBadges />
            </div>
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6C2BFF" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span className="text-white/30 text-xs" dir="rtl" lang="ar">
                مدفوعاتك محمية ومشفرة
              </span>
            </div>
          </div>
        </div>

        {/* ── Legal links ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 py-5 border-b border-white/5">
          {LEGAL_LINKS.map((link) => (
            <LocalizedClientLink
              key={link.href}
              href={link.href}
              className="text-white/30 hover:text-white/60 text-xs transition-colors duration-200"
              dir="rtl"
              lang="ar"
            >
              {link.labelAr}
            </LocalizedClientLink>
          ))}
        </div>

        {/* ── Bottom bar ────────────────────────────────────────────── */}
        <div className="flex flex-wrap w-full mt-5 justify-between items-center gap-3">
          <span className="text-white/20 text-xs">
            © {new Date().getFullYear()} Promptr. All rights reserved.
          </span>
          <div className="flex items-center gap-3">
            <span className="text-white/15 text-xs">المملكة العربية السعودية · Saudi Arabia</span>
            <span className="text-white/10 text-xs">promptrsa.com</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
