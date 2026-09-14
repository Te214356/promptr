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
   banner accent. */

/*
  Two subject-specific drawings, chosen on 2026-09-15 from six candidates.
  Both are short SVG paths in the accent colour with a single cyan point of
  emphasis, kept on the logical end side (away from the copy in both text
  directions) so they never sit behind the title or the button. Below the
  `small` breakpoint the copy spans the whole slide, so there is no free side
  and the drawing is hidden rather than layered under the text (measured on
  production at 820px and 390px: it overlapped the title there).
*/

/** A rising path of connected nodes ending in one large node: from the idea to the first 100 orders. */
const OrdersPath = ({ accent }: { accent: string }) => (
  <svg
    className="pointer-events-none absolute top-1/2 hidden -translate-y-1/2 end-[-16px] small:block h-[300px] w-[300px] opacity-[0.18]"
    viewBox="0 0 200 200"
    fill="none"
    stroke={accent}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M18 168 L62 140 L98 150 L134 96 L176 44" />
    <path d="M62 140v34M98 150v24M134 96v78" strokeDasharray="3 6" strokeWidth="1.2" />
    <circle cx="18" cy="168" r="5" />
    <circle cx="62" cy="140" r="5" />
    <circle cx="98" cy="150" r="5" />
    <circle cx="134" cy="96" r="5" />
    <circle cx="176" cy="44" r="13" />
    <circle cx="176" cy="44" r="4" fill="#00CFFF" stroke="none" />
    <path d="M18 184h164" strokeWidth="1.2" />
  </svg>
)

/** Three layers of connected nodes; the two output nodes carry the cyan point. */
const NeuralNet = ({ accent }: { accent: string }) => (
  <svg
    className="pointer-events-none absolute top-1/2 hidden -translate-y-1/2 end-[-16px] small:block h-[320px] w-[320px] opacity-[0.16]"
    viewBox="0 0 200 200"
    fill="none"
    stroke={accent}
    strokeWidth="1.4"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <g strokeOpacity="0.8">
      <path d="M40 60L100 44M40 60L100 80M40 60L100 116M40 60L100 152M40 100L100 44M40 100L100 80M40 100L100 116M40 100L100 152M40 140L100 44M40 140L100 80M40 140L100 116M40 140L100 152" />
      <path d="M100 44L160 80M100 44L160 120M100 80L160 80M100 80L160 120M100 116L160 80M100 116L160 120M100 152L160 80M100 152L160 120" />
    </g>
    {/* Node fills match the slide ground so the edges stop at the node rim. */}
    <g fill="#0d0d1f">
      <circle cx="40" cy="60" r="7" />
      <circle cx="40" cy="100" r="7" />
      <circle cx="40" cy="140" r="7" />
      <circle cx="100" cy="44" r="7" />
      <circle cx="100" cy="80" r="7" />
      <circle cx="100" cy="116" r="7" />
      <circle cx="100" cy="152" r="7" />
      <circle cx="160" cy="80" r="9" />
      <circle cx="160" cy="120" r="9" />
    </g>
    <circle cx="160" cy="80" r="3.5" fill="#00CFFF" stroke="none" />
    <circle cx="160" cy="120" r="3.5" fill="#00CFFF" stroke="none" />
  </svg>
)

const Decoration = ({
  kind,
  accent,
}: {
  kind: BannerDecoration
  accent: string
}) => {
  if (kind === "neural-net") return <NeuralNet accent={accent} />
  return <OrdersPath accent={accent} />
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
    className={`absolute inset-0 overflow-hidden rounded-2xl ${
      instant ? "" : "transition-opacity duration-700 ease-out"
    } ${isActive ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0"}`}
    style={{ background: banner.gradient }}
    role="group"
    aria-roledescription="slide"
    aria-label={label}
    aria-hidden={!isActive}
  >
    <Decoration kind={banner.decoration} accent={banner.accent} />

    <div className="relative flex h-full flex-col justify-center gap-4 px-7 py-8 small:px-14">
      <span
        className="flex h-11 w-11 items-center justify-center rounded-xl"
        style={{ background: `${banner.accent}22`, color: banner.accent }}
        aria-hidden="true"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          {ICONS[banner.icon]}
        </svg>
      </span>

      <h2 className="max-w-[36rem] text-2xl font-bold leading-[1.3] text-white small:text-4xl">
        {title}
      </h2>

      <p className="max-w-[34rem] text-sm leading-relaxed text-white/60 small:text-base">
        {description}
      </p>

      <LocalizedClientLink
        href={banner.href}
        tabIndex={isActive ? undefined : -1}
        className="mt-1 inline-flex w-fit items-center rounded-full bg-[#6C2BFF] px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#5a22dd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00CFFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d1f]"
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
        {/* Same ground as the category cards (#0d0d1f); the tinted shadow and
            the ring are what keep the slide from dissolving into the page. */}
        <div className="relative h-[320px] overflow-hidden rounded-2xl bg-[#0d0d1f] shadow-[0_20px_60px_-25px_rgba(108,43,255,0.55)] ring-1 ring-white/10 small:h-[340px]">
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
