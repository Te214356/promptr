import { Metadata } from "next"

import { getAllPosts, getAllTags } from "@lib/blog/posts"
import { getBaseURL } from "@lib/util/env"
import BlogListTemplate from "@modules/blog/templates/blog-list"

const TITLE = "المدونة | Promptr"
const DESCRIPTION =
  "مقالات عملية عن الذكاء الاصطناعي، المنتجات الرقمية، وبناء دخل إضافي من الإنترنت — مكتوبة للسوق العربي."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${getBaseURL()}/blog` },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: `${getBaseURL()}/blog`,
    siteName: "Promptr",
    locale: "ar_SA",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
}

export default function BlogPage() {
  const posts = getAllPosts()
  const tags = getAllTags()

  return <BlogListTemplate posts={posts} tags={tags} />
}
