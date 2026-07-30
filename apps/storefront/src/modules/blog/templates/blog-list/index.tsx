import { clx } from "@medusajs/ui"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import type { BlogPostMeta } from "@lib/blog/types"
import PostCard from "@modules/blog/components/post-card"
import TagPill from "@modules/blog/components/tag-pill"

type BlogListTemplateProps = {
  posts: BlogPostMeta[]
  tags: { tag: string; count: number }[]
}

const EmptyState = () => (
  <div className="flex flex-col items-center gap-y-5 rounded-large border border-dashed border-promptr-border bg-promptr-card/50 px-8 py-20 text-center">
    <div
      aria-hidden="true"
      className="flex h-16 w-16 items-center justify-center rounded-full bg-[radial-gradient(circle,rgba(108,43,255,0.3),transparent_70%)]"
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#00CFFF"
        strokeWidth="1.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 5.5A2.5 2.5 0 016.5 3H16l4 4v13.5a1.5 1.5 0 01-1.5 1.5h-12A2.5 2.5 0 014 19.5v-14zM15 3v5h5M8 13h8M8 17h5"
        />
      </svg>
    </div>
    <div className="flex flex-col gap-y-2">
      <h2 className="text-lg font-semibold text-white">
        لا توجد مقالات منشورة بعد
      </h2>
      <p className="max-w-sm text-sm leading-relaxed text-white/50">
        نعمل حاليًا على أول دفعة من المقالات. في هذه الأثناء، يمكنك تصفّح
        منتجاتنا الرقمية الجاهزة.
      </p>
    </div>
    <LocalizedClientLink
      href="/store"
      className="rounded-full border border-promptr-purple/40 px-6 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-promptr-purple/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-promptr-cyan"
    >
      تصفّح المتجر
    </LocalizedClientLink>
  </div>
)

const BlogListTemplate = ({ posts, tags }: BlogListTemplateProps) => {
  const [featured, ...rest] = posts

  return (
    <div className="content-container py-16 small:py-24">
      <header className="mx-auto mb-16 max-w-2xl text-center">
        <p className="mb-4 text-[11px] uppercase tracking-[0.3em] text-white/35">
          Promptr Blog
        </p>
        <h1 className="mb-5 text-4xl font-black leading-tight small:text-5xl">
          <span className="bg-gradient-to-l from-promptr-purple to-promptr-cyan bg-clip-text text-transparent">
            المدونة
          </span>
        </h1>
        <p className="text-[15px] leading-relaxed text-white/55">
          مقالات عملية عن الذكاء الاصطناعي، المنتجات الرقمية، وبناء دخل إضافي من
          الإنترنت — مكتوبة للسوق العربي.
        </p>

        {tags.length > 0 && (
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {tags.map(({ tag, count }) => (
              <TagPill key={tag} tag={tag} count={count} size="md" />
            ))}
          </div>
        )}
      </header>

      {posts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-8">
          <PostCard post={featured} variant="featured" />

          {rest.length > 0 && (
            <div
              className={clx(
                "grid gap-6",
                // A lone remaining card would otherwise sit at a third of the
                // row with dead space beside it — let it run the full width.
                rest.length > 1 && "small:grid-cols-2 medium:grid-cols-3"
              )}
            >
              {rest.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default BlogListTemplate
