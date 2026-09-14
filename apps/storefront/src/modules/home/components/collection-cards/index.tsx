"use client"

import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useLanguage } from "@lib/context/language-context"

import type { HomeCategoryCard } from "@lib/data/home"

/*
  English names are not stored on the categories in Admin, so they are kept
  here by handle; a category without an entry falls back to its Admin name.
*/
const TITLE_EN: Record<string, string> = {
  "ai-tools": "AI Tools & Prompts",
  "templates-design": "Templates & Design",
  "digital-books": "Digital Books",
}

function countLabel(n: number, lang: "ar" | "en") {
  if (lang === "en") return n === 1 ? "1 product" : `${n} products`
  if (n === 0) return "لا منتجات بعد"
  if (n === 1) return "منتج واحد"
  if (n === 2) return "منتجان"
  if (n <= 10) return `${n} منتجات`
  return `${n} منتجًا`
}

/*
  The covers fan out like the hero shelf. Positions are picked by how many
  covers the category actually has (1, 2 or 3), so a category with a single
  product shows one large cover rather than an empty stack.
*/
const FAN: Record<number, string[]> = {
  // Cards get two covers (see lib/data/home.ts); the 3-fan stays for a catalogue large enough to afford it.
  1: ["start-[22%] top-3 w-[56%] rotate-[-3deg]"],
  2: [
    "start-[4%] top-6 w-[56%] rotate-[-6deg]",
    "end-[4%] top-0 w-[56%] rotate-[4deg]",
  ],
  3: [
    "start-0 top-8 w-[52%] rotate-[-8deg] opacity-80",
    "start-[24%] top-0 w-[52%] rotate-[1deg] opacity-90",
    "end-0 top-5 w-[52%] rotate-[7deg]",
  ],
}

/*
  Category cards fed by the catalogue, not by a static list: each shows the
  real covers of products inside it and the product count, both allocated in
  `lib/data/home.ts` together with the rail and the hero shelf so no cover
  repeats between sections. Adding a product in Admin updates the card within
  the catalogue's 60-second revalidate window.
*/
export default function CategoryCards({ cards }: { cards: HomeCategoryCard[] }) {
  const { lang } = useLanguage()
  const isRTL = lang === "ar"

  return (
    <section className="py-16 lg:py-24 px-6 bg-[#080810]" dir={isRTL ? "rtl" : "ltr"}>
      <div className="content-container">
        <div className="flex items-baseline justify-between gap-4 mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            {isRTL ? "التصنيفات" : "Categories"}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
          {cards.map((card) => {
            const covers = card.covers.slice(0, 3)
            const fan = FAN[covers.length] ?? []
            return (
              <LocalizedClientLink
                key={card.handle}
                href={`/categories/${card.handle}`}
                className="group relative flex flex-col rounded-2xl border border-white/5 bg-[#0d0d1f] hover:border-[#6C2BFF]/40 transition-colors duration-300 overflow-hidden min-h-[340px] sm:min-h-[380px] lg:min-h-[420px]"
              >
                {/* Covers */}
                <div className="relative h-[190px] sm:h-[220px] lg:h-[250px] mx-6 mt-7">
                  {covers.map((cover, i) => (
                    <div
                      key={cover.src}
                      className={`absolute ${fan[i]} aspect-square rounded-xl overflow-hidden ring-1 ring-white/10 shadow-[0_24px_40px_-16px_rgba(0,0,0,0.85)] transition-transform duration-300 group-hover:-translate-y-1.5`}
                      style={{ zIndex: i + 1 }}
                    >
                      <Image
                        src={cover.src}
                        alt={cover.title}
                        fill
                        sizes="(max-width: 640px) 60vw, 240px"
                        quality={60}
                        className="object-cover"
                        draggable={false}
                      />
                    </div>
                  ))}
                  {covers.length === 0 && (
                    <div className="absolute inset-0 rounded-xl border border-dashed border-white/10" />
                  )}
                </div>

                {/* Title + count */}
                <div className="relative mt-auto p-6 pt-4 flex items-end justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white leading-snug">
                      {isRTL ? card.name : TITLE_EN[card.handle] ?? card.name}
                    </h3>
                    <p className="text-sm text-white/50 mt-1 tabular-nums">
                      {countLabel(card.count, lang)}
                    </p>
                  </div>
                  <svg
                    className={`w-6 h-6 shrink-0 mb-1 text-white/25 group-hover:text-white/70 transition-all duration-200 ${isRTL ? "rotate-[-135deg] group-hover:-translate-x-0.5" : "-rotate-45 group-hover:translate-x-0.5"} group-hover:-translate-y-0.5`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>

                <div className="absolute bottom-0 inset-x-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-[#6C2BFF] to-transparent" />
              </LocalizedClientLink>
            )
          })}
        </div>
      </div>
    </section>
  )
}
