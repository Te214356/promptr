'use client'
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useLanguage } from "@lib/context/language-context"

const COLLECTIONS = [
  {
    handle: "recharge-cards",
    titleAr: "بطاقات شحن واشتراكات",
    titleEn: "Recharge Cards & Subscriptions",
    accent: "#6C2BFF",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    handle: "templates-designs",
    titleAr: "قوالب وتصاميم وواجهات",
    titleEn: "Templates, Designs & UI",
    accent: "#00CFFF",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="8" height="8" rx="1" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="13" y="3" width="8" height="8" rx="1" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="3" y="13" width="8" height="8" rx="1" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="13" y="13" width="8" height="8" rx="1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    handle: "digital-books",
    titleAr: "كتب رقمية",
    titleEn: "Digital Books",
    accent: "#6C2BFF",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    handle: "ai-section",
    titleAr: "قسم AI",
    titleEn: "AI Products",
    accent: "#00CFFF",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 14h.01M15 14h.01" strokeLinecap="round" strokeWidth="2" />
      </svg>
    ),
  },
]

export default function CollectionCards() {
  const { lang } = useLanguage()
  const isRTL = lang === "ar"

  return (
    <section className="py-20 px-6 bg-[#080810]">
      <div className="content-container">
        {/* Section label */}
        <div className="flex items-center gap-3 mb-12">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#6C2BFF]/30" />
          <span className="text-white/40 text-xs uppercase tracking-[0.2em] font-medium">
            {lang === "ar" ? "المجموعات" : "Collections"}
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#6C2BFF]/30" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
          {COLLECTIONS.map((col) => (
            <LocalizedClientLink
              key={col.handle}
              href={`/collections/${col.handle}`}
              className="group relative flex flex-col justify-between p-7 rounded-2xl border border-white/5 bg-[#0d0d1f] hover:border-[#6C2BFF]/40 transition-all duration-300 overflow-hidden min-h-[180px]"
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                style={{ background: `radial-gradient(ellipse at 20% 50%, ${col.accent}08 0%, transparent 70%)` }}
              />

              {/* Top row: icon + arrow */}
              <div className="flex items-start justify-between relative z-10">
                <div className="p-2.5 rounded-xl" style={{ background: `${col.accent}15`, color: col.accent }}>
                  {col.icon}
                </div>
                <svg
                  className="w-5 h-5 text-white/20 group-hover:text-white/60 -rotate-45 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>

              {/* Text */}
              <div className="relative z-10 mt-6" dir={isRTL ? "rtl" : "ltr"}>
                <p
                  className="text-xl font-bold text-white leading-snug"
                  style={{ fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif" }}
                >
                  {lang === "ar" ? col.titleAr : col.titleEn}
                </p>
              </div>

              {/* Bottom accent line */}
              <div
                className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(90deg, transparent, ${col.accent}, transparent)` }}
              />
            </LocalizedClientLink>
          ))}
        </div>
      </div>
    </section>
  )
}
