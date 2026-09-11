import { Metadata } from "next"

import { getAllPosts, getAllTags } from "@lib/blog/posts"
import { getBaseURL } from "@lib/util/env"
import BlogListTemplate from "@modules/blog/templates/blog-list"

const TITLE = "المدونة | Promptr"
const DESCRIPTION =
  "مقالات عملية عن الذكاء الاصطناعي، المنتجات الرقمية، وبناء دخل إضافي من الإنترنت — مكتوبة للسوق العربي."

/**
 * ⛔ الـcanonical إقليمي (`/sa/blog`) لا مجرّد (`/blog`).
 *
 * كان مجرّدًا، وهو **يناقض جيرانه**: المقالات تُعلن `/${countryCode}/blog/<slug>`،
 * و`sitemap.xml` يسمّي الصيغة الإقليمية، والمسار المجرّد يردّ 307 لا 200.
 * أي أن هذه الصفحة كانت وحدها تُرشّح عنوانًا لا يُقدَّم مباشرةً.
 *
 * ولهذا صارت `generateMetadata`: القيمة الثابتة لا تصل إلى `countryCode`.
 */
export async function generateMetadata(props: {
  params: Promise<{ countryCode: string }>
}): Promise<Metadata> {
  const { countryCode } = await props.params
  const url = `${getBaseURL()}/${countryCode}/blog`

  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: TITLE,
      description: DESCRIPTION,
      url,
      siteName: "Promptr",
      locale: "ar_SA",
    },
    twitter: {
      card: "summary_large_image",
      title: TITLE,
      description: DESCRIPTION,
    },
  }
}

export default function BlogPage() {
  const posts = getAllPosts()
  const tags = getAllTags()

  return <BlogListTemplate posts={posts} tags={tags} />
}
