import { Suspense } from "react"

import { listRegions } from "@lib/data/regions"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-cookie"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import LanguageToggle from "@modules/layout/components/language-toggle"
import NavAccountLink from "@modules/layout/components/nav-account-link"

export default async function Nav() {
  const [regions, locales, currentLocale] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
  ])

  return (
    <div className="sticky top-0 inset-x-0 z-50">
      <header className="relative h-16 mx-auto border-b border-white/5 bg-[#080810]/90 backdrop-blur-md">
        {/*
          Three columns: menu | wordmark | language + cart. The wordmark column
          must not shrink and the row needs a real gap: on 390px the side
          columns used to squeeze until the toggle touched the wordmark
          (0px, measured on production) and the cart label wrapped to three
          lines. Below `xsmall` (512px) the wordmark is set smaller and the
          cart collapses to an icon with a count. The side columns also size
          from their content there (`basis-auto`) instead of splitting the row
          in halves: with equal halves the wider language+cart column overflowed
          toward the wordmark (5px at 360px) while the menu side kept 57px.
          The wordmark is a few pixels off exact centre on phones in exchange
          for even gaps on both sides.
        */}
        <nav className="content-container flex items-center justify-between gap-x-3 w-full h-full">
          <div className="flex-1 basis-auto xsmall:basis-0 min-w-0 h-full flex items-center">
            <div className="h-full">
              <SideMenu regions={regions} locales={locales} currentLocale={currentLocale} />
            </div>
          </div>

          <div className="flex items-center h-full shrink-0">
            <LocalizedClientLink
              href="/"
              className="hover:opacity-80 transition-opacity duration-200"
              data-testid="nav-store-link"
            >
              <span
                className="text-[17px] tracking-[0.18em] xsmall:text-[22px] xsmall:tracking-[0.25em]"
                style={{
                  fontWeight: 900,
                  textTransform: "uppercase",
                  lineHeight: 1,
                  fontFamily: "'Arial Black', Arial, sans-serif",
                  background: "linear-gradient(135deg, #6C2BFF 0%, #00CFFF 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                PROMPTR
              </span>
            </LocalizedClientLink>
          </div>

          <div className="flex items-center gap-x-3 xsmall:gap-x-4 h-full flex-1 basis-auto xsmall:basis-0 min-w-0 justify-end">
            <LanguageToggle />
            <div className="hidden small:flex items-center gap-x-6 h-full">
              <NavAccountLink />
            </div>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="text-white/60 hover:text-white transition-colors duration-200"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
                  </svg>
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>
    </div>
  )
}
