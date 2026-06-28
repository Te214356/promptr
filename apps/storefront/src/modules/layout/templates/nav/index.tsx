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
        <nav className="content-container flex items-center justify-between w-full h-full">
          <div className="flex-1 basis-0 h-full flex items-center">
            <div className="h-full">
              <SideMenu regions={regions} locales={locales} currentLocale={currentLocale} />
            </div>
          </div>

          <div className="flex items-center h-full">
            <LocalizedClientLink
              href="/"
              className="hover:opacity-80 transition-opacity duration-200 flex items-center gap-2.5"
              data-testid="nav-store-link"
            >
              <svg
                width="38"
                height="38"
                viewBox="0 0 36 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ flexShrink: 0 }}
              >
                <defs>
                  <linearGradient id="nav-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#6C2BFF" />
                    <stop offset="100%" stopColor="#00CFFF" />
                  </linearGradient>
                </defs>
                <rect width="36" height="36" rx="9" fill="url(#nav-grad)" />
                <text
                  x="9"
                  y="26"
                  fill="white"
                  fontSize="22"
                  fontWeight="800"
                  fontFamily="'Arial Black', Arial, sans-serif"
                  letterSpacing="-1"
                >
                  P
                </text>
                <circle cx="27" cy="11" r="5" fill="#00CFFF" />
              </svg>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#F5F5F5",
                  letterSpacing: "0.18em",
                  fontFamily: "'Arial Black', Arial, sans-serif",
                  textTransform: "uppercase",
                  lineHeight: 1,
                }}
              >
                PROMPTR
              </span>
            </LocalizedClientLink>
          </div>

          <div className="flex items-center gap-x-4 h-full flex-1 basis-0 justify-end">
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
