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

/**
 * Only rendered when the post actually has a cover. Cover-less posts show no
 * placeholder at all — their text simply takes the full card width.
 */
const CoverArt = ({
  post,
  className,
  sizes,
}: {
  post: BlogPostMeta & { cover: string }
  className: string
  sizes: string
}) => (
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
)

const PostCard = ({ post, variant = "default" }: PostCardProps) => {
  const featured = variant === "featured"
  const hasCover = Boolean(post.cover)

  return (
    <LocalizedClientLink
      href={`/blog/${post.slug}`}
      className={clx(
        "group flex overflow-hidden rounded-large border border-promptr-border bg-promptr-card",
        "transition-all duration-200 hover:-translate-y-1 hover:border-promptr-purple/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-promptr-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-promptr-bg",
        // The side-by-side split only makes sense when there is an image to
        // sit beside; without one the text column runs the full card width.
        featured && hasCover ? "flex-col small:flex-row" : "flex-col"
      )}
      data-testid={`blog-card-${post.slug}`}
    >
      {hasCover && (
        <CoverArt
          post={post as BlogPostMeta & { cover: string }}
          className={clx(
            featured
              ? "h-56 w-full shrink-0 small:h-auto small:w-[46%]"
              : "h-44 w-full"
          )}
          sizes={
            featured
              ? "(max-width: 1024px) 100vw, 46vw"
              : "(max-width: 1024px) 100vw, 33vw"
          }
        />
      )}

      <div
        className={clx(
          "flex flex-1 flex-col",
          featured ? "gap-y-4" : "gap-y-3",
          featured && !hasCover ? "p-8 small:p-10" : featured ? "p-8" : "p-6"
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
