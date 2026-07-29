import { clx } from "@medusajs/ui"

import { formatPostDate } from "@lib/blog/format"

type PostMetaProps = {
  date: string
  readingMinutes: number
  className?: string
}

/** Arabic has distinct singular, dual and small-plural forms for counts. */
function readingLabel(minutes: number): string {
  if (minutes === 1) return "دقيقة قراءة"
  if (minutes === 2) return "دقيقتان قراءة"
  if (minutes <= 10) return `${minutes} دقائق قراءة`
  return `${minutes} دقيقة قراءة`
}

const PostMeta = ({ date, readingMinutes, className }: PostMetaProps) => (
  <div
    className={clx(
      "flex items-center gap-x-3 text-xs text-white/45",
      className
    )}
  >
    <time dateTime={date}>{formatPostDate(date)}</time>
    <span aria-hidden="true" className="h-1 w-1 rounded-full bg-white/20" />
    <span>{readingLabel(readingMinutes)}</span>
  </div>
)

export default PostMeta
