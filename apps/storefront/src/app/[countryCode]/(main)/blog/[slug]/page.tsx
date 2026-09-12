import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getPostBySlug, getRelatedPosts } from "@lib/blog/posts"
import { getBaseURL } from "@lib/util/env"
import ArticleJsonLd from "@modules/blog/components/article-jsonld"
import BlogPostTemplate from "@modules/blog/templates/blog-post"

type Props = {
  params: Promise<{ countryCode: string; slug: string }>
}

/**
 * Social crawlers need an absolute URL.
 *
 * ✅ والبديل الافتراضي صار موجودًا (2026-09-12): `public/images/brand/og-default.png`
 * بمقاس 1200×630. كان مكتوبًا هنا أن الوسم يُحذف عند غياب الغلاف «لأن الإشارة
 * إلى نائب غير موجود أسوأ من حذفه» — وهو صحيح وقتها، وقد انقضى.
 */
function toAbsolute(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `${getBaseURL()}${url}`
}

/**
 * Rendered per request, like the product route. The parent (main) layout reads
 * cookies for auth and cart, so this segment can never be fully prerendered
 * anyway — and a dynamic render is what lets `notFound()` return a real 404.
 */
export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { countryCode, slug } = await params
  const post = getPostBySlug(slug)

  // Must bail out here, not just in the page body: metadata resolves before the
  // render stream opens, so this is what makes an unknown slug answer a real
  // 404 instead of a soft 200. Same pattern as the product route.
  if (!post) {
    notFound()
  }

  const url = `${getBaseURL()}/${countryCode}/blog/${post.slug}`

  // ⛔ بطاقة افتراضية بدل لا شيء. **كل المقالات السبعة عشر بلا `cover`**، وكانت
  // الصفحة تُصدر `openGraph` بلا `images` إطلاقًا — و`app/opengraph-image.jpg`
  // الجذري **لا يُورَّث** حين تُعرّف الصفحة كائن `openGraph` خاصًا بها. فكل
  // مشاركة على واتساب أو إكس تظهر رابطًا أصمّ بلا صورة، على موقع أولويته
  // جلب الزوار من المشاركات.
  //
  // والبطاقة بالهوية لا بصورة موضوعية: مقاسها 1200×630 وهو ما تتوقعه المنصات،
  // وتبقى صحيحة لأي مقال. ⚠️ وأي مقال يضيف `cover` يتقدّم عليها تلقائيًا.
  const image = post.cover
    ? toAbsolute(post.cover)
    : `${getBaseURL()}/images/brand/og-default.png`

  return {
    title: `${post.title} | مدونة Promptr`,
    description: post.description,
    keywords: post.tags,
    authors: [{ name: post.author }],
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url,
      siteName: "Promptr",
      locale: "ar_SA",
      publishedTime: post.date,
      tags: post.tags,
      ...(image ? { images: [{ url: image, alt: post.title }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: post.title,
      description: post.description,
      ...(image ? { images: [image] } : {}),
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { countryCode, slug } = await params
  const post = getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const related = getRelatedPosts(post.slug)
  const url = `${getBaseURL()}/${countryCode}/blog/${post.slug}`

  return (
    <>
      <ArticleJsonLd
        post={post}
        url={url}
        // ⛔ البطاقة الافتراضية **لا تُمرَّر إلى JSON-LD** عمدًا: `Article.image`
        // في schema.org يعني صورة تُمثّل المقال، والبطاقة شعارٌ لا يمثّل شيئًا.
        // وسمُ og غرضه بصري في المشاركات، والبيانات المنظّمة غرضها وصفي — فلا
        // يُملأ حقل وصفي بقيمة زخرفية. (نفس مبدأ رفض `aggregateRating` الملفّق.)
        imageUrl={post.cover ? toAbsolute(post.cover) : undefined}
      />
      <BlogPostTemplate post={post} related={related} />
    </>
  )
}
