import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default async function Footer() {
  const { collections } = await listCollections({
    fields: "*products",
  })
  const productCategories = await listCategories()

  return (
    <footer className="border-t border-white/5 bg-[#080810] w-full">
      {/* Top gradient rule */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#6C2BFF]/40 to-transparent" />

      <div className="content-container flex flex-col w-full py-16">
        <div className="flex flex-col gap-y-10 xsmall:flex-row items-start justify-between">
          {/* Brand */}
          <div className="flex flex-col gap-y-3">
            <LocalizedClientLink
              href="/"
              className="font-bold text-2xl tracking-widest text-white hover:text-[#00CFFF] transition-colors duration-200 uppercase"
            >
              Promptr
            </LocalizedClientLink>
            <p className="text-white/30 text-xs max-w-[200px] leading-relaxed" dir="rtl" lang="ar">
              متجرك الرقمي المتكامل
            </p>
            <p className="text-white/20 text-xs">Your digital marketplace</p>
          </div>

          {/* Links */}
          <div className="text-sm gap-10 md:gap-x-16 grid grid-cols-2 sm:grid-cols-3">
            {productCategories && productCategories.length > 0 && (
              <div className="flex flex-col gap-y-3">
                <span className="text-white/50 text-xs uppercase tracking-widest font-medium">
                  Categories
                </span>
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
                <span className="text-white/50 text-xs uppercase tracking-widest font-medium">
                  Collections
                </span>
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
                  <LocalizedClientLink
                    className="text-white/40 hover:text-white text-sm transition-colors duration-200"
                    href="/store"
                  >
                    All Products
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    className="text-white/40 hover:text-white text-sm transition-colors duration-200"
                    href="/account"
                  >
                    Account
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    className="text-white/40 hover:text-white text-sm transition-colors duration-200"
                    href="/cart"
                  >
                    Cart
                  </LocalizedClientLink>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex w-full mt-16 pt-6 border-t border-white/5 justify-between items-center">
          <span className="text-white/20 text-xs">
            © {new Date().getFullYear()} Promptr. All rights reserved.
          </span>
          <span className="text-white/10 text-xs">
            promptrsa.com
          </span>
        </div>
      </div>
    </footer>
  )
}
