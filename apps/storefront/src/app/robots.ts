import type { MetadataRoute } from "next"

import { getBaseURL } from "@lib/util/env"

/**
 * المصدر الوحيد لـ`robots.txt` — مسار Next الأصلي، وبجانبه `app/sitemap.ts`.
 *
 * سبق أن وُجد في المستودع ملف إعداد `next-sitemap.js` **بلا حزمة مثبَّتة ولا
 * سكربت `postbuild` يشغّله**، فلم يكن الموقع يقدّم `robots.txt` ولا
 * `sitemap.xml` إطلاقًا. وقد **حُذف الملف في 2026-09-12** بعد التحقق من أنه
 * ميت — ولم يكن ميتًا فحسب بل معطوبًا: `siteUrl` كان يقرأ
 * `NEXT_PUBLIC_VERCEL_URL` (ونحن على Railway)، و`exclude` كان جمع مصفوفتين
 * بـ`+` فيُنتج **سلسلة نصية واحدة** لا مصفوفة.
 *
 * ⛔ فلا تُعِد `next-sitemap`: الملفان هنا يغطّيانه، وإعادته تعني مصدرين
 * متنافسين لنفس الملفين.
 */
export default function robots(): MetadataRoute.Robots {
  const base = getBaseURL()

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Checkout and account pages are per-user and must stay out of search.
        disallow: ["/*/checkout", "/*/account", "/*/order", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
