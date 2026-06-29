'use client'
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useLanguage } from "@lib/context/language-context"

const CATEGORIES = [
  {
    handle: "ai-tools",
    titleAr: "أدوات الذكاء الاصطناعي",
    titleEn: "AI Tools & Prompts",
    accent: "#6C2BFF",
    image: "https://dtcbackend-production-32a2.up.railway.app/static/1782630095815-high-level-description-a-cinematic-3d-re_NiMhLzr4VQ6f5VcQM4VEVg_UYn_yjMkT6mXXt9hvh9_Pg_cover.jpg",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 14h.01M15 14h.01" strokeLinecap="round" strokeWidth="2" />
      </svg>
    ),
  },
  {
    handle: "templates-design",
    titleAr: "قوالب وتصاميم وواجهات",
    titleEn: "Templates & Design",
    accent: "#00CFFF",
    image: "https://dtcbackend-production-32a2.up.railway.app/static/1782630102843-high-level-description-a-moody-3d-render_GCN03TnGV4mKWLQaKCOC8w_fALYfn2tSqid8VPHswacEw.jpg",
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
    image: "https://dtcbackend-production-32a2.up.railway.app/static/1782630110279-high-level-description-a-cinematic-3d-ma_AUupCT7xX6eBuFQV82dlxw_2-cfsLJ3SYKJSXhsUKVgZQ.jpg",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" strokeLinecap="round" strokeLinejoin="round" />
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
            {lang === "ar" ? "التصنيفات" : "Categories"}
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#6C2BFF]/30" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
          {CATEGORIES.map((cat) => (
            <LocalizedClientLink
              key={cat.handle}
              href={`/categories/${cat.handle}`}
              className="group relative flex flex-col justify-between rounded-2xl border border-white/5 bg-[#0d0d1f] hover:border-[#6C2BFF]/40 transition-all duration-300 overflow-hidden min-h-[220px]"
            >
              {/* Background image */}
              <div
                className="absolute inset-0 bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity duration-500"
                style={{ backgroundImage: `url(${cat.image})` }}
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#080810] via-[#080810]/60 to-transparent" />

              {/* Hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                style={{ background: `radial-gradient(ellipse at 20% 50%, ${cat.accent}10 0%, transparent 70%)` }}
              />

              {/* Content */}
              <div className="relative z-10 p-7 flex flex-col h-full justify-between">
                {/* Top row: icon + arrow */}
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-xl" style={{ background: `${cat.accent}20`, color: cat.accent }}>
                    {cat.icon}
                  </div>
                  <svg
                    className="w-5 h-5 text-white/20 group-hover:text-white/60 -rotate-45 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>

                {/* Text */}
                <div className="mt-6" dir={isRTL ? "rtl" : "ltr"}>
                  <p
                    className="text-xl font-bold text-white leading-snug"
                    style={{ fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif" }}
                  >
                    {lang === "ar" ? cat.titleAr : cat.titleEn}
                  </p>
                </div>
              </div>

              {/* Bottom accent line */}
              <div
                className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(90deg, transparent, ${cat.accent}, transparent)` }}
              />
            </LocalizedClientLink>
          ))}
        </div>
      </div>
    </section>
  )
}
