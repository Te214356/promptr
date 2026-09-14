/**
 * Promo banner content. Edit copy, links, colours and artwork choice here —
 * the slider component reads this array and renders whatever it finds.
 *
 * Deliberately free of counts ("12 products", "11 articles"): those numbers go
 * stale and nobody remembers to update a banner.
 */

export type BannerDecoration = "circles" | "dots" | "geometric"
export type BannerIcon = "store" | "book" | "article"

export type Banner = {
  id: string
  titleAr: string
  titleEn: string
  descriptionAr: string
  descriptionEn: string
  ctaAr: string
  ctaEn: string
  href: string
  /**
   * Dark gradient on the card ground (#0d0d1f) with a faint wash of the
   * accent. The banners used to be the one light surface on the page; since
   * 2026-09-15 they share the category cards' language and the purple-tinted
   * shadow plus the hairline ring keep them from sinking into the background.
   */
  gradient: string
  /** Drives the decorative artwork and the icon tint. */
  accent: string
  decoration: BannerDecoration
  icon: BannerIcon
}

/*
  The "store" slide was removed on 2026-09-15: it repeated the hero's message
  ("digital products for the Saudi market" + a second "browse the store"
  button) one screen below it. The hero and the product rail now say that
  with real products.
*/
export const BANNERS: Banner[] = [
  {
    id: "ecommerce-guide",
    titleAr: "دليل متجرك الإلكتروني — من الفكرة إلى أول 100 طلب",
    titleEn: "Your online store guide — from idea to the first 100 orders",
    descriptionAr: "خطوات عملية للسوق السعودي: التحقق من الفكرة، المنصة، الأنظمة، والنمو.",
    descriptionEn: "A practical path for Saudi sellers: validation, platform, regulations, growth.",
    ctaAr: "اعرف التفاصيل",
    ctaEn: "See the guide",
    href: "/products/ecommerce-success-guide",
    gradient: "linear-gradient(135deg, rgba(0,207,255,0.16) 0%, #0d0d1f 55%, rgba(108,43,255,0.10) 100%)",
    accent: "#00CFFF",
    decoration: "geometric",
    icon: "book",
  },
  {
    id: "blog",
    titleAr: "مقالات عملية في المدونة",
    titleEn: "Practical articles on the blog",
    descriptionAr: "الذكاء الاصطناعي، التجارة الإلكترونية، وخدمة العملاء — بلا حشو.",
    descriptionEn: "AI, e-commerce and customer service — no filler.",
    ctaAr: "اقرأ المدونة",
    ctaEn: "Read the blog",
    href: "/blog",
    gradient: "linear-gradient(135deg, rgba(108,43,255,0.18) 0%, #0d0d1f 55%, rgba(0,207,255,0.08) 100%)",
    accent: "#6C2BFF",
    decoration: "dots",
    icon: "article",
  },
]
