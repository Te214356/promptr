"use client"

import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useLanguage } from "@lib/context/language-context"

export type HeroCover = {
  src: string
  title: string
  handle: string
}

const CONTENT = {
  ar: {
    eyebrow: "منتجات رقمية للسوق السعودي",
    headline: "أدلة وحزم برومبتات جاهزة، تحمّلها بعد الدفع مباشرة",
    body: "قوالب وكتب وأدوات ذكاء اصطناعي مكتوبة بالعربية، تُسلَّم كملفات فور إتمام الشراء.",
    cta: "استكشف المتجر",
    ctaSecondary: "اقرأ المدونة",
  },
  en: {
    eyebrow: "Digital products for the Saudi market",
    headline: "Guides and prompt packs, ready to download the moment you pay",
    body: "Templates, books and AI tools written in Arabic, delivered as files right after checkout.",
    cta: "Explore the store",
    ctaSecondary: "Read the blog",
  },
}

/*
  The first shelf: three real product covers on one side, the pitch on the
  other. Until 2026-09-15 this section was a centred headline over a purple
  glow with no image and no product — the home page (all 2624px of it)
  showed nothing that could be bought. The covers come from the catalogue
  itself, so the shelf changes when the products do.

  No `min-h-[90vh]`: the section is as tall as its content, so the product
  rail below starts inside the first screen on a desktop viewport.
*/
const Hero = ({ covers }: { covers: HeroCover[] }) => {
  const { lang } = useLanguage()
  const t = CONTENT[lang]
  const isRTL = lang === "ar"
  const shelf = covers.slice(0, 3)

  return (
    <section
      className="relative overflow-hidden bg-[#080810]"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* One soft glow behind the shelf side only, so the light has a source. */}
      <div className="absolute top-1/2 -translate-y-1/2 end-[-10%] w-[640px] h-[640px] rounded-full bg-[#6C2BFF]/10 blur-[120px] pointer-events-none" />

      <div className="content-container relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-12 items-center pt-14 pb-10 lg:pt-20 lg:pb-16">
        {/* Copy */}
        <div className="lg:col-span-6 max-w-xl">
          <p className="text-sm font-semibold text-[#00CFFF] mb-4">{t.eyebrow}</p>
          <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold text-white leading-[1.25] lg:leading-[1.2] text-balance mb-5">
            {t.headline}
          </h1>
          <p className="text-lg text-white/60 leading-relaxed mb-8">{t.body}</p>
          <div className="flex items-center gap-6 flex-wrap">
            <LocalizedClientLink
              href="/store"
              className="px-8 py-3.5 bg-[#6C2BFF] hover:bg-[#5a22dd] text-white rounded-full font-semibold text-base transition-colors duration-200"
            >
              {t.cta}
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/blog"
              className="text-base font-medium text-white/70 hover:text-white underline-offset-4 hover:underline transition-colors duration-200"
            >
              {t.ctaSecondary}
            </LocalizedClientLink>
          </div>
        </div>

        {/* Shelf: three covers, staggered like books leaning on a shelf */}
        {shelf.length > 0 && (
          <div className="lg:col-span-6 relative h-[300px] sm:h-[360px] lg:h-[440px]">
            {shelf.map((cover, i) => {
              // Back-to-front: the last cover is the front one and the largest.
              const front = i === shelf.length - 1
              const pos = [
                "start-0 top-8 w-[46%] rotate-[-6deg] opacity-80",
                "start-[22%] top-0 w-[50%] rotate-[3deg] opacity-90",
                "end-0 top-6 w-[54%] rotate-[-2deg]",
              ][i]
              return (
                <LocalizedClientLink
                  key={cover.handle}
                  href={`/products/${cover.handle}`}
                  aria-label={cover.title}
                  className={`absolute ${pos} aspect-square rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)] transition-transform duration-300 hover:-translate-y-2 hover:rotate-0`}
                  style={{ zIndex: i + 1 }}
                >
                  <Image
                    src={cover.src}
                    alt={cover.title}
                    fill
                    sizes="(max-width: 640px) 55vw, (max-width: 1024px) 40vw, 340px"
                    quality={60}
                    priority={front}
                    className="object-cover"
                    draggable={false}
                  />
                </LocalizedClientLink>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

export default Hero
