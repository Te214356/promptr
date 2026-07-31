"use client"

import { useEffect, useState } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useLanguage } from "@lib/context/language-context"
import { BANNERS, type Banner, type BannerDecoration, type BannerIcon } from "./banners"

const ROTATE_MS = 6000

const LABELS = {
  ar: {
    region: "بنرات دعائية",
    prev: "البنر السابق",
    next: "البنر التالي",
    goTo: (n: number) => `انتقل إلى البنر رقم ${n}`,
    slide: (n: number, total: number) => `البنر ${n} من ${total}`,
  },
  en: {
    region: "Promotional banners",
    prev: "Previous banner",
    next: "Next banner",
    goTo: (n: number) => `Go to banner ${n}`,
    slide: (n: number, total: number) => `Banner ${n} of ${total}`,
  },
}

/* ── Decorative artwork ───────────────────────────────────────────────
   Pure inline SVG: no network request, no layout cost, and it inherits the
   banner accent. Kept in the far corner and under 10% opacity so the title
   stays the only thing the eye lands on. Pattern ids are namespaced per
   banner — duplicate ids across SVGs on one page resolve to the first match. */

const Circles = ({ accent }: { accent: string }) => (
  <svg
    className="pointer-events-none absolute -top-16 left-[-40px] h-[320px] w-[320px] opacity-[0.08] small:left-auto small:right-[-40px]"
    viewBox="0 0 200 200"
    fill="none"
    aria-hidden="true"
  >
    {[90, 70, 50, 30].map((r) => (
      <circle key={r} cx="100" cy="100" r={r} stroke={accent} strokeWidth="2" />
    ))}
  </svg>
)

const Dots = ({ accent, id }: { accent: string; id: string }) => (
  <svg
    className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.10]"
    aria-hidden="true"
  >
    <defs>
      <pattern id={`promo-dots-${id}`} width="22" height="22" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="2" fill={accent} />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill={`url(#promo-dots-${id})`} />
  </svg>
)

const Geometric = ({ accent }: { accent: string }) => (
  <svg
    className="pointer-events-none absolute -bottom-10 left-[-30px] h-[280px] w-[280px] opacity-[0.09] small:left-auto small:right-[-20px]"
    viewBox="0 0 200 200"
    fill="none"
    aria-hidden="true"
  >
    <rect x="40" y="40" width="110" height="110" rx="16" stroke={accent} strokeWidth="2" />
    <rect
      x="40"
      y="40"
      width="110"
      height="110"
      rx="16"
      stroke={accent}
      strokeWidth="2"
      transform="rotate(18 95 95)"
    />
    <path d="M20 160 L100 20 L180 160 Z" stroke={accent} strokeWidth="2" />
  </svg>
)

const Decoration = ({
  kind,
  accent,
  id,
}: {
  kind: BannerDecoration
  accent: string
  id: string
}) => {
  if (kind === "dots") return <Dots accent={accent} id={id} />
  if (kind === "geometric") return <Geometric accent={accent} />
  return <Circles accent={accent} />
}

const ICONS: Record<BannerIcon, JSX.Element> = {
  store: (
    <>
      <path d="M3 9l1.5-5h15L21 9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 9h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 20v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  article: (
    <>
      <path d="M5 4h11l3 3v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 10h8M8 14h8M8 18h5" strokeLinecap="round" />
    </>
  ),
}

const Chevron = ({ pointsRight }: { pointsRight: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path
      d={pointsRight ? "M9 5l7 7-7 7" : "M15 5l-7 7 7 7"}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

/* ── Slide ───────────────────────────────────────────────────────────── */

const Slide = ({
  banner,
  isActive,
  label,
  cta,
  title,
  description,
  instant,
}: {
  banner: Banner
  isActive: boolean
  label: string
  cta: string
  title: string
  description: string
  instant: boolean
}) => (
  <div
    className={`absolute inset-0 overflow-hidden rounded-3xl ${
      instant ? "" : "transition-opacity duration-700 ease-out"
    } ${isActive ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0"}`}
    style={{ background: banner.gradient }}
    role="group"
    aria-roledescription="slide"
    aria-label={label}
    aria-hidden={!isActive}
  >
    <Decoration kind={banner.decoration} accent={banner.accent} id={banner.id} />

    <div className="relative flex h-full flex-col justify-center gap-4 px-7 py-8 small:px-14">
      <span
        className="flex h-11 w-11 items-center justify-center rounded-xl"
        style={{ background: "rgba(8,8,16,0.06)", color: banner.accent }}
        aria-hidden="true"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          {ICONS[banner.icon]}
        </svg>
      </span>

      <h2 className="max-w-[36rem] text-2xl font-black leading-[1.15] text-[#080810] small:text-4xl">
        {title}
      </h2>

      <p className="max-w-[34rem] text-sm leading-relaxed text-[#080810]/70 small:text-base">
        {description}
      </p>

      <LocalizedClientLink
        href={banner.href}
        tabIndex={isActive ? undefined : -1}
        className="mt-1 inline-flex w-fit items-center rounded-full bg-[#080810] px-6 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#080810] focus-visible:ring-offset-2"
      >
        {cta}
      </LocalizedClientLink>
    </div>
  </div>
)

/* ── Slider ──────────────────────────────────────────────────────────── */

const PromoBanners = () => {
  const { lang } = useLanguage()
  const t = LABELS[lang]
  const isRTL = lang === "ar"

  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  // Read the preference live: users flip it mid-session and the OS event is
  // the only signal we get.
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReducedMotion(query.matches)
    sync()
    query.addEventListener("change", sync)
    return () => query.removeEventListener("change", sync)
  }, [])

  // Keyed on `index`, so any manual navigation restarts the countdown rather
  // than advancing again a moment later.
  useEffect(() => {
    if (reducedMotion || paused || BANNERS.length < 2) {
      return
    }

    const timer = setTimeout(
      () => setIndex((current) => (current + 1) % BANNERS.length),
      ROTATE_MS
    )

    return () => clearTimeout(timer)
  }, [index, paused, reducedMotion])

  const step = (delta: number) =>
    setIndex((current) => (current + delta + BANNERS.length) % BANNERS.length)

  if (BANNERS.length === 0) {
    return null
  }

  return (
    <section className="bg-[#080810] px-6 pb-4 pt-14">
      <div
        className="content-container"
        aria-roledescription="carousel"
        aria-label={t.region}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        {/* Fixed height: slides stack absolutely, so copy length never shifts
            the page. Fade instead of translate — a slide transition needs
            direction maths that inverts under RTL. */}
        <div className="relative h-[320px] overflow-hidden rounded-3xl shadow-[0_20px_60px_-25px_rgba(108,43,255,0.55)] ring-1 ring-white/10 small:h-[340px]">
          {BANNERS.map((banner, i) => (
            <Slide
              key={banner.id}
              banner={banner}
              isActive={i === index}
              instant={reducedMotion}
              label={t.slide(i + 1, BANNERS.length)}
              title={isRTL ? banner.titleAr : banner.titleEn}
              description={isRTL ? banner.descriptionAr : banner.descriptionEn}
              cta={isRTL ? banner.ctaAr : banner.ctaEn}
            />
          ))}
        </div>

        {BANNERS.length > 1 && (
          <div className="mt-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {BANNERS.map((banner, i) => (
                <button
                  key={banner.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={t.goTo(i + 1)}
                  aria-current={i === index}
                  className={`h-2 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00CFFF] ${
                    i === index ? "w-7 bg-white/80" : "w-2 bg-white/25 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label={t.prev}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/60 transition-colors duration-200 hover:border-[#6C2BFF]/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00CFFF]"
              >
                <Chevron pointsRight={isRTL} />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label={t.next}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/60 transition-colors duration-200 hover:border-[#6C2BFF]/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00CFFF]"
              >
                <Chevron pointsRight={!isRTL} />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default PromoBanners
