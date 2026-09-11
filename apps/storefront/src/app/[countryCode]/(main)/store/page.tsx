import { Metadata } from "next"

import { getBaseURL } from "@lib/util/env"

import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"

const TITLE = "المتجر — كل المنتجات الرقمية | Promptr"
const DESCRIPTION =
  "تصفّح كل منتجات Promptr الرقمية: حزم برومبتات عربية جاهزة، وأدلة عملية للتجارة الإلكترونية والتسويق والذكاء الاصطناعي — تُسلَّم فور إتمام الطلب."

/**
 * صفحة فهرس المتجر: أهم صفحة بعد الرئيسية من منظور السيو.
 *
 * ⛔ كانت بلا canonical فتُفهرس بعنوانين (`/store` و`/sa/store`)، والإقليمي
 * هو الأصل — وهو ما يردّ 200 بلا تحويل وما يسمّيه `sitemap.xml`.
 *
 * وكان عنوانها «Store» ووصفها «Explore all of our products.» — إنجليزيان
 * على متجر عربي، أي أن نتيجة البحث كانت تعرض كلمة واحدة لا تصف شيئًا.
 */
export async function generateMetadata(props: {
  params: Promise<{ countryCode: string }>
}): Promise<Metadata> {
  const { countryCode } = await props.params

  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: `${getBaseURL()}/${countryCode}/store` },
  }
}

type Params = {
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
  }>
  params: Promise<{
    countryCode: string
  }>
}

export default async function StorePage(props: Params) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { sortBy, page } = searchParams

  return (
    <StoreTemplate
      sortBy={sortBy}
      page={page}
      countryCode={params.countryCode}
    />
  )
}
