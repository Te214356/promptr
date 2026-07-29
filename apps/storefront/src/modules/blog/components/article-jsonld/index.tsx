import type { BlogPostMeta } from "@lib/blog/types"

type ArticleJsonLdProps = {
  post: BlogPostMeta
  /** Absolute canonical URL of the article. */
  url: string
  /** Absolute URL of the cover image, when the post has one. */
  imageUrl?: string
}

/**
 * schema.org `Article` markup so search engines can surface the post as an
 * article rather than a generic page.
 */
const ArticleJsonLd = ({ post, url, imageUrl }: ArticleJsonLdProps) => {
  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    inLanguage: "ar",
    datePublished: post.date,
    dateModified: post.date,
    keywords: post.tags.join(", "),
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: { "@type": "Organization", name: post.author },
    publisher: {
      "@type": "Organization",
      name: "Promptr",
      url: "https://promptrsa.com",
    },
    ...(imageUrl ? { image: [imageUrl] } : {}),
  }

  return (
    <script
      type="application/ld+json"
      // Content is repo-authored; `<` is escaped to keep the script tag intact.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  )
}

export default ArticleJsonLd
