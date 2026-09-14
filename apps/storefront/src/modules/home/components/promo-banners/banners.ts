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
  /** Light gradient — the banners are the bright surface on a dark page. */
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
    gradient: "linear-gradient(135deg, #DDF3FF 0%, #F1FBFF 100%)",
    accent: "#00A6D6",
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
    gradient: "linear-gradient(135deg, #E6E9FF 0%, #E9F8FF 100%)",
    accent: "#5B3FD9",
    decoration: "dots",
    icon: "article",
  },
]
