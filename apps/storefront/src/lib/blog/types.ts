export type BlogPostMeta = {
  slug: string
  title: string
  description: string
  /** ISO date string, e.g. "2026-07-28" */
  date: string
  tags: string[]
  cover?: string
  author: string
  draft: boolean
  readingMinutes: number
}

export type TocEntry = {
  id: string
  text: string
  /** 2 or 3 — only h2/h3 make it into the table of contents */
  depth: 2 | 3
}

export type BlogPost = BlogPostMeta & {
  html: string
  toc: TocEntry[]
}
