import type { MetadataRoute } from "next"

/**
 * ⛔ سبب وجود هذا الملف: **أيقونتا أندرويد 192 و512 لا تصلان إلا من manifest.**
 *
 * اتفاقيات App Router تغطّي الباقي وحدها: `app/icon.png` يُخرج
 * `<link rel="icon">` بالمقاس والنوع، و`app/apple-icon.png` يُخرج
 * `apple-touch-icon`، و`public/favicon.ico` يخدم الطلب المجرّد `/favicon.ico`
 * الذي يرسله كل متصفح وزاحف بلا وسم. أما مقاسا أندرويد فمكانهما هنا لا هناك.
 *
 * ⚠️ ولا تُضف `start_url` أو `display: "standalone"` بلا قصد: تحويل الموقع إلى
 * تطبيق قابل للتثبيت قرار منتج لا تفصيل أيقونات.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Promptr — متجرك الرقمي المتكامل",
    short_name: "Promptr",
    description:
      "منتجات رقمية مختارة للعالم العربي الحديث — أدلة وحزم برومبتات وقوالب جاهزة.",
    lang: "ar",
    dir: "rtl",
    background_color: "#080810",
    theme_color: "#6C2BFF",
    icons: [
      { src: "/images/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/images/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  }
}
