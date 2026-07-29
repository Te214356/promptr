import Image from "next/image"
import { clx } from "@medusajs/ui"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import type { BlogPostMeta } from "@lib/blog/types"
import PostMeta from "../post-meta"
import TagPill from "../tag-pill"

type PostCardProps = {
  post: BlogPostMeta
  /** `featured` renders the wide hero card used for the newest article. */
  variant?: "default" | "featured"
}

const CoverArt = ({
  post,
  className,
  sizes,
}: {
  post: BlogPostMeta
  className: string
  sizes: string
}) =>
  post.cover ? (
    <div className={clx("relative overflow-hidden bg-promptr-bg", className)}>
      <Image
        src={post.cover}
        alt={post.title}
        fill
        sizes={sizes}
        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-promptr-card/80 to-transparent" />
    </div>
  ) : (
    // Cover-less posts get a generated gradient plate so the grid stays even.
    // Purely graphical — no text, which would clip at narrow card widths.
    <div
      aria-hidden="true"
      className={clx(
        "relative overflow-hidden bg-[radial-gradient(circle_at_30%_20%,rgba(108,43,255,0.35),transparent_60%),radial-gradient(circle_at_75%_80%,rgba(0,207,255,0.22),transparent_55%)]",
        className
      )}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          viewBox="0 0 48 48"
          fill="none"
          className="h-12 w-12 text-white/[0.13] transition-transform duration-500 group-hover:scale-110"
        >
          <path
            d="M24 4l4.6 12.1L41 20.7l-12.4 4.6L24 37.4l-4.6-12.1L7 20.7l12.4-4.6z"
            fill="currentColor"
          />
          <circle cx="38" cy="38" r="3.5" fill="currentColor" />
        </svg>
      </div>
    </div>
  )

const PostCard = ({ post, variant = "default" }: PostCardProps) => {
  const featured = variant === "featured"

  return (
    <LocalizedClientLink
      href={`/blog/${post.slug}`}
      className={clx(
        "group flex overflow-hidden rounded-large border border-promptr-border bg-promptr-card",
        "transition-all duration-200 hover:-translate-y-1 hover:border-promptr-purple/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-promptr-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-promptr-bg",
        featured ? "flex-col small:flex-row" : "flex-col"
      )}
      data-testid={`blog-card-${post.slug}`}
    >
      <CoverArt
        post={post}
        className={clx(
          featured
            ? "h-56 w-full shrink-0 small:h-auto small:w-[46%]"
            : "h-44 w-full"
        )}
        sizes={featured ? "(max-width: 1024px) 100vw, 46vw" : "(max-width: 1024px) 100vw, 33vw"}
      />

      <div
        className={clx(
          "flex flex-1 flex-col",
          featured ? "gap-y-4 p-8" : "gap-y-3 p-6"
        )}
      >
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.slice(0, 2).map((tag) => (
              <TagPill key={tag} tag={tag} />
            ))}
          </div>
        )}

        <h2
          className={clx(
            "font-bold leading-snug text-white transition-colors duration-200 group-hover:text-promptr-cyan",
            featured ? "text-2xl small:text-[28px]" : "text-lg"
          )}
        >
          {post.title}
        </h2>

        {post.description && (
          <p
            className={clx(
              "leading-relaxed text-white/55",
              featured ? "text-[15px]" : "line-clamp-3 text-sm"
            )}
          >
            {post.description}
          </p>
        )}

        <PostMeta
          date={post.date}
          readingMinutes={post.readingMinutes}
          className="mt-auto pt-2"
        />
      </div>
    </LocalizedClientLink>
  )
}

export default PostCard
