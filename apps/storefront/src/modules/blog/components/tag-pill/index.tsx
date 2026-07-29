import { clx } from "@medusajs/ui"

type TagPillProps = {
  tag: string
  /** Optional post count, shown after the label. */
  count?: number
  size?: "sm" | "md"
  className?: string
}

const TagPill = ({ tag, count, size = "sm", className }: TagPillProps) => (
  <span
    className={clx(
      "inline-flex items-center gap-x-1.5 rounded-full border border-promptr-border bg-white/[0.03] font-medium text-white/70 transition-colors duration-200",
      size === "sm" ? "px-3 py-1 text-[11px]" : "px-4 py-1.5 text-xs",
      className
    )}
  >
    {tag}
    {count !== undefined && (
      // Isolated from the surrounding RTL run — without this the separator and
      // digits get reordered, so "· 10" renders as "١ ٠".
      <span dir="ltr" className="text-white/40">
        ({count})
      </span>
    )}
  </span>
)

export default TagPill
