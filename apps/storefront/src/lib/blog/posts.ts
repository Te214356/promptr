import "server-only"

import fs from "fs"
import path from "path"
import matter from "gray-matter"

import { estimateReadingTime, renderArticle } from "./markdown"
import type { BlogPost, BlogPostMeta } from "./types"

/**
 * Articles live as Markdown files in `apps/storefront/content/blog`.
 *
 * Railway starts the storefront with `cd apps/storefront && next start`, so
 * `process.cwd()` is the package root in production. The second candidate keeps
 * things working if a process is ever started from the monorepo root instead.
 */
const CONTENT_DIR_CANDIDATES = [
  path.join(process.cwd(), "content", "blog"),
  path.join(process.cwd(), "apps", "storefront", "content", "blog"),
]

function resolveContentDir(): string | null {
  for (const dir of CONTENT_DIR_CANDIDATES) {
    if (fs.existsSync(dir)) {
      return dir
    }
  }
  return null
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean)
  }
  if (typeof value === "string" && value.trim()) {
    return [value.trim()]
  }
  return []
}

function parseFile(dir: string, filename: string): BlogPost | null {
  const slug = filename.replace(/\.mdx?$/, "")
  const raw = fs.readFileSync(path.join(dir, filename), "utf-8")
  const { data, content } = matter(raw)

  if (!data.title || !data.date) {
    console.warn(`[blog] skipping "${filename}": missing title or date`)
    return null
  }

  const { html, toc } = renderArticle(content)

  return {
    slug,
    title: String(data.title),
    description: String(data.description ?? ""),
    date: new Date(data.date).toISOString().slice(0, 10),
    tags: asStringArray(data.tags),
    cover: data.cover ? String(data.cover) : undefined,
    author: String(data.author ?? "Promptr"),
    draft: data.draft === true,
    readingMinutes: estimateReadingTime(content),
    html,
    toc,
  }
}

let cache: BlogPost[] | null = null

function loadPosts(): BlogPost[] {
  // Re-read on every request in development so edits show up without a restart.
  if (cache && process.env.NODE_ENV === "production") {
    return cache
  }

  const dir = resolveContentDir()
  if (!dir) {
    console.warn("[blog] content/blog directory not found — no posts to render")
    cache = []
    return cache
  }

  const posts = fs
    .readdirSync(dir)
    .filter((file) => /\.mdx?$/.test(file))
    .map((file) => parseFile(dir, file))
    .filter((post): post is BlogPost => post !== null)
    .filter((post) => !post.draft)
    .sort((a, b) => b.date.localeCompare(a.date))

  cache = posts
  return posts
}

function toMeta(post: BlogPost): BlogPostMeta {
  const { html: _html, toc: _toc, ...meta } = post
  return meta
}

/** Published posts, newest first. Drafts are always excluded. */
export function getAllPosts(): BlogPostMeta[] {
  return loadPosts().map(toMeta)
}

export function getPostBySlug(slug: string): BlogPost | null {
  return loadPosts().find((post) => post.slug === slug) ?? null
}

export function getAllSlugs(): string[] {
  return loadPosts().map((post) => post.slug)
}

/** Every tag in use, ordered by how many posts carry it. */
export function getAllTags(): { tag: string; count: number }[] {
  const counts = new Map<string, number>()

  for (const post of loadPosts()) {
    for (const tag of post.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }

  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, "ar"))
}

/**
 * Posts sharing the most tags with the given one, falling back to the newest
 * other posts so the section is never empty when siblings exist.
 */
export function getRelatedPosts(slug: string, limit = 3): BlogPostMeta[] {
  const all = loadPosts()
  const current = all.find((post) => post.slug === slug)
  if (!current) {
    return []
  }

  const others = all.filter((post) => post.slug !== slug)
  const scored = others.map((post) => ({
    post,
    score: post.tags.filter((tag) => current.tags.includes(tag)).length,
  }))

  return scored
    .sort((a, b) => b.score - a.score || b.post.date.localeCompare(a.post.date))
    .slice(0, limit)
    .map(({ post }) => toMeta(post))
}
