import LocalizedClientLink from "@modules/common/components/localized-client-link"
import type { BlogPostMeta } from "@lib/blog/types"
import PostMeta from "../post-meta"

type RelatedPostsProps = {
  posts: BlogPostMeta[]
}

const RelatedPosts = ({ posts }: RelatedPostsProps) => {
  if (posts.length === 0) {
    return null
  }

  return (
    <section
      aria-labelledby="related-posts-heading"
      className="border-t border-promptr-border pt-12"
    >
      <h2
        id="related-posts-heading"
        className="mb-8 text-xl font-bold text-white"
      >
        اقرأ أيضًا
      </h2>

      <div className="grid gap-4 small:grid-cols-3">
        {posts.map((post) => (
          <LocalizedClientLink
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex flex-col gap-y-3 rounded-large border border-promptr-border bg-promptr-card p-5 transition-all duration-200 hover:-translate-y-1 hover:border-promptr-purple/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-promptr-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-promptr-bg"
          >
            <h3 className="text-[15px] font-semibold leading-snug text-white transition-colors duration-200 group-hover:text-promptr-cyan">
              {post.title}
            </h3>
            <PostMeta
              date={post.date}
              readingMinutes={post.readingMinutes}
              className="mt-auto"
            />
          </LocalizedClientLink>
        ))}
      </div>
    </section>
  )
}

export default RelatedPosts
