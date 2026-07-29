import Image from "next/image"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import type { BlogPost, BlogPostMeta } from "@lib/blog/types"
import PostMeta from "@modules/blog/components/post-meta"
import RelatedPosts from "@modules/blog/components/related-posts"
import TableOfContents from "@modules/blog/components/table-of-contents"
import TagPill from "@modules/blog/components/tag-pill"

type BlogPostTemplateProps = {
  post: BlogPost
  related: BlogPostMeta[]
}

const BackToBlog = () => (
  <LocalizedClientLink
    href="/blog"
    className="inline-flex items-center gap-x-2 text-sm text-white/50 transition-colors duration-200 hover:text-promptr-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-promptr-cyan"
  >
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      /* RTL page: the arrow must point right, back toward the list. */
      className="rotate-180"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
    </svg>
    كل المقالات
  </LocalizedClientLink>
)

const BlogPostTemplate = ({ post, related }: BlogPostTemplateProps) => (
  <article className="pb-24">
    {post.cover && (
      <div className="relative h-[240px] w-full small:h-[380px]">
        <Image
          src={post.cover}
          alt={post.title}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-promptr-bg via-promptr-bg/40 to-transparent" />
      </div>
    )}

    <div className="content-container">
      <header
        className={
          post.cover
            ? "relative mx-auto -mt-20 max-w-[760px] pb-10"
            : "mx-auto max-w-[760px] pb-10 pt-16"
        }
      >
        <div className="mb-6">
          <BackToBlog />
        </div>

        {post.tags.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <TagPill key={tag} tag={tag} />
            ))}
          </div>
        )}

        <h1 className="mb-5 text-3xl font-black leading-[1.3] text-white small:text-[42px]">
          {post.title}
        </h1>

        {post.description && (
          <p className="mb-6 text-lg leading-relaxed text-white/60">
            {post.description}
          </p>
        )}

        <PostMeta date={post.date} readingMinutes={post.readingMinutes} />
      </header>

      {/* Article column is capped at ~700px for comfortable line length;
          the table of contents sits in a rail beside it on large screens. */}
      <div className="mx-auto grid max-w-[760px] gap-10 large:max-w-none large:grid-cols-[minmax(0,700px)_240px] large:justify-center">
        <div className="flex flex-col gap-y-10">
          <div className="large:hidden">
            <TableOfContents entries={post.toc} variant="inline" />
          </div>

          <div
            className="prose-promptr"
            /* Repo-authored Markdown only — see src/lib/blog/markdown.ts */
            dangerouslySetInnerHTML={{ __html: post.html }}
          />

          <div className="border-t border-promptr-border pt-8">
            <BackToBlog />
          </div>
        </div>

        <aside className="hidden large:block">
          <TableOfContents entries={post.toc} variant="rail" />
        </aside>
      </div>

      {related.length > 0 && (
        <div className="mx-auto mt-20 max-w-[760px]">
          <RelatedPosts posts={related} />
        </div>
      )}
    </div>
  </article>
)

export default BlogPostTemplate
