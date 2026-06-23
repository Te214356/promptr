'use client'
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useLanguage } from "@lib/context/language-context"

const CONTENT = {
  ar: {
    headline: "متجرك الرقمي المتكامل",
    subheadline: "منصة متكاملة للمنتجات الرقمية في السعودية",
    body: "منتجات رقمية مختارة للعالم العربي الحديث — بطاقات شحن، قوالب، كتب، وأدوات AI",
    cta: "استكشف المتجر",
    ctaSecondary: "جميع المنتجات",
  },
  en: {
    headline: "Your Complete Digital Marketplace",
    subheadline: "The premium platform for digital products in Saudi Arabia",
    body: "Curated digital products for the modern Arab world — recharge cards, templates, books, and AI tools",
    cta: "Explore Store",
    ctaSecondary: "All Products",
  },
}

const Hero = () => {
  const { lang } = useLanguage()
  const t = CONTENT[lang]
  const isRTL = lang === "ar"

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#080810]">
      {/* Purple glow blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[#6C2BFF]/10 blur-[130px] pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-[#00CFFF]/5 blur-[90px] pointer-events-none" />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(108,43,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(108,43,255,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Horizontal rule accent */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#6C2BFF]/50 to-transparent" />

      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto" dir={isRTL ? "rtl" : "ltr"}>
        <h1
          className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-4 leading-tight"
          style={{ fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif" }}
        >
          {t.headline}
        </h1>

        <h2 className="text-2xl sm:text-3xl font-light mb-6 bg-gradient-to-r from-[#6C2BFF] to-[#00CFFF] bg-clip-text text-transparent">
          {t.subheadline}
        </h2>

        <p className="text-white/40 text-base sm:text-lg mb-12 max-w-2xl mx-auto leading-relaxed">
          {t.body}
        </p>

        <div className="flex gap-4 justify-center flex-wrap">
          <LocalizedClientLink
            href="/store"
            className="px-8 py-3 bg-[#6C2BFF] hover:bg-[#5a22dd] text-white rounded-full font-medium text-sm transition-all duration-200 hover:shadow-[0_0_40px_rgba(108,43,255,0.5)]"
          >
            {t.cta}
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/store"
            className="px-8 py-3 border border-white/15 hover:border-[#6C2BFF]/70 text-white/80 hover:text-white rounded-full font-medium text-sm transition-all duration-200"
          >
            {t.ctaSecondary}
          </LocalizedClientLink>
        </div>
      </div>
    </section>
  )
}

export default Hero
