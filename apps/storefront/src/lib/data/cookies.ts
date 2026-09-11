import "server-only"
import { cookies as nextCookies } from "next/headers"

export const getAuthHeaders = async (): Promise<
  { authorization: string } | {}
> => {
  try {
    const cookies = await nextCookies()
    const token = cookies.get("_medusa_jwt")?.value

    if (!token) {
      return {}
    }

    return { authorization: `Bearer ${token}` }
  } catch {
    return {}
  }
}

export const getCacheTag = async (tag: string): Promise<string> => {
  try {
    const cookies = await nextCookies()
    const cacheId = cookies.get("_medusa_cache_id")?.value

    if (!cacheId) {
      return ""
    }

    return `${tag}-${cacheId}`
  } catch (error) {
    return ""
  }
}

/**
 * مهلة تجديد كاش بيانات الكتالوج (بالثواني).
 *
 * ⛔ بدونها كان جلب الكتالوج `force-cache` **بلا أي مهلة**، والوسم وحده
 * يُبطِله — والوسم لا يصمد:
 *   1. `getCacheTag` يُرجع سلسلة فارغة إن غاب كوكي `_medusa_cache_id`،
 *      فيُرجع `getCacheOptions` أدناه كائنًا فارغًا ⟵ **جلب بلا وسم**.
 *   2. والـmiddleware يضبط ذلك الكوكي على **الاستجابة** لا على الطلب، فأول
 *      زيارة من متصفح بلا كوكي — وهي الحالة الغالبة: زائر جديد، زاحف، نافذة
 *      خاصة، وأول طلب بعد كل نشر — تُنشئ عنصر الكاش **أصمّ لا وسم له**.
 *   3. ومفتاح الـData Cache هو الطلب لا الوسم، فكل زائر لاحق يُعيد استعمال
 *      ذلك العنصر الأصمّ.
 *   4. ووسم `products` لا يُبطَل إلا من تبديل اللغة أو المنطقة — **وكلاهما
 *      يُطلقه زائر**. فتعديل سعر من Admin **لا يملك أي مسار** لإبطاله.
 *
 * فالنتيجة كانت سعرًا قديمًا إلى أجل غير مسمّى، لا يزول إلا بإعادة نشر.
 *
 * ⚠️ والمهلة علاج لا حلّ: السقف 60 ثانية. الحلّ الجذري بند مفتوح في
 * CLAUDE.md (subscriber في الباك إند ⟵ مسار `revalidate` بوسم ثابت).
 *
 * 💡 والثمن قريب من الصفر لأن صفحات الكتالوج `force-dynamic` أصلًا — الـHTML
 * غير مكوَّش، فالتجديد يمسّ نداءً خلفيًا واحدًا كل دقيقة بحدّ أقصى (~0.5s
 * مقيسة على الإنتاج)، لا كل طلب.
 */
export const CATALOG_REVALIDATE_SECONDS = 60

export const getCacheOptions = async (
  tag: string
): Promise<{ tags: string[] } | {}> => {
  if (typeof window !== "undefined") {
    return {}
  }

  const cacheTag = await getCacheTag(tag)

  if (!cacheTag) {
    return {}
  }

  return { tags: [`${cacheTag}`] }
}

export const setAuthToken = async (token: string) => {
  const cookies = await nextCookies()
  cookies.set("_medusa_jwt", token, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
}

export const removeAuthToken = async () => {
  const cookies = await nextCookies()
  cookies.set("_medusa_jwt", "", {
    maxAge: -1,
  })
}

export const getCartId = async () => {
  const cookies = await nextCookies()
  return cookies.get("_medusa_cart_id")?.value
}

export const setCartId = async (cartId: string) => {
  const cookies = await nextCookies()
  cookies.set("_medusa_cart_id", cartId, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
}

export const removeCartId = async () => {
  const cookies = await nextCookies()
  cookies.set("_medusa_cart_id", "", {
    maxAge: -1,
  })
}
