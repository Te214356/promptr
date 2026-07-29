"use client"

import { useEffect, useState } from "react"
import { clx } from "@medusajs/ui"

import type { TocEntry } from "@lib/blog/types"

type TableOfContentsProps = {
  entries: TocEntry[]
  /**
   * `rail` is the sticky sidebar shown on large screens; `inline` is the
   * collapsible panel placed above the article body on smaller ones. The
   * caller decides which one is mounted so the two never both render.
   */
  variant: "rail" | "inline"
}

/**
 * Highlights whichever heading is currently nearest the top of the viewport.
 * Falls back silently if IntersectionObserver is unavailable.
 */
function useActiveHeading(entries: TocEntry[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(
    entries[0]?.id ?? null
  )

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      return
    }

    const visible = new Set<string>()

    const observer = new IntersectionObserver(
      (records) => {
        for (const record of records) {
          if (record.isIntersecting) {
            visible.add(record.target.id)
          } else {
            visible.delete(record.target.id)
          }
        }

        // Keep document order rather than intersection order.
        const first = entries.find((entry) => visible.has(entry.id))
        if (first) {
          setActiveId(first.id)
        }
      },
      // Bias the band toward the top so a heading activates as it arrives.
      { rootMargin: "-88px 0px -65% 0px", threshold: 0 }
    )

    const nodes = entries
      .map((entry) => document.getElementById(entry.id))
      .filter((node): node is HTMLElement => node !== null)

    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [entries])

  return activeId
}

const TocList = ({
  entries,
  activeId,
  onNavigate,
}: {
  entries: TocEntry[]
  activeId: string | null
  onNavigate?: () => void
}) => (
  <ul className="flex flex-col gap-y-1 border-e border-promptr-border pe-4">
    {entries.map((entry) => (
      <li key={entry.id}>
        <a
          href={`#${entry.id}`}
          onClick={onNavigate}
          className={clx(
            "block rounded-base py-1.5 text-[13px] leading-relaxed transition-colors duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-promptr-cyan",
            entry.depth === 3 && "ps-4 text-xs",
            activeId === entry.id
              ? "font-medium text-promptr-cyan"
              : "text-white/45 hover:text-white/80"
          )}
        >
          {entry.text}
        </a>
      </li>
    ))}
  </ul>
)

const TableOfContents = ({ entries, variant }: TableOfContentsProps) => {
  const [open, setOpen] = useState(false)
  const activeId = useActiveHeading(entries)

  // Short articles do not benefit from an index.
  if (entries.length < 3) {
    return null
  }

  if (variant === "rail") {
    return (
      <nav
        aria-label="محتويات المقال"
        className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto no-scrollbar"
      >
        <p className="mb-4 text-[11px] uppercase tracking-[0.2em] text-white/35">
          المحتويات
        </p>
        <TocList entries={entries} activeId={activeId} />
      </nav>
    )
  }

  return (
    <div className="rounded-large border border-promptr-border bg-promptr-card">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-5 py-4 text-sm font-medium text-white/80 transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-promptr-cyan"
      >
        <span>محتويات المقال</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
          className={clx(
            "transition-transform duration-200",
            open && "rotate-180"
          )}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <div
        className={clx(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5">
            <TocList
              entries={entries}
              activeId={activeId}
              onNavigate={() => setOpen(false)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default TableOfContents
