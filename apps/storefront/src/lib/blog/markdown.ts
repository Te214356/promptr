import { Marked, type RendererObject, type Tokens } from "marked"

import type { TocEntry } from "./types"

/**
 * Markdown → HTML for blog articles.
 *
 * The output is injected with `dangerouslySetInnerHTML`, which is only safe
 * because articles are authored in-repo and go through git review. Never route
 * externally-submitted content through here.
 *
 * Note on the marked API: overrides must be supplied as a plain object of
 * methods. A `Renderer` subclass does not work — marked reads the renderer's
 * own enumerable properties, and subclass methods live on the prototype, so
 * they are silently ignored (while instance fields raise
 * `renderer '<field>' does not exist`).
 */

const ALERT_MARKER = /^\[!(NOTE|TIP|WARNING)\]\s*/i

const ALERT_LABELS: Record<string, string> = {
  note: "ملاحظة",
  tip: "نصيحة",
  warning: "تنبيه",
}

/**
 * Everything that is NOT an Arabic letter, Latin letter, digit, space or dash.
 * Spelled out as explicit ranges rather than `\p{L}` because tsconfig targets
 * es5, where the `u` regex flag is unavailable.
 */
const NON_SLUG_CHARS =
  /[^0-9a-z؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿\s-]/g

/**
 * Arabic punctuation sits inside the letter ranges above, so it survives
 * `NON_SLUG_CHARS` and has to be removed separately — otherwise a heading
 * ending in "؟" produces an id ending in "؟".
 */
const ARABIC_PUNCTUATION = /[،؛؟٫٬٪۔﴾﴿]/g

/**
 * Builds a URL-fragment-safe id from a heading. Arabic letters are kept as-is —
 * they survive `encodeURIComponent` round-tripping in every modern browser.
 */
function slugifyHeading(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[ً-ٰٟ]/g, "") // strip Arabic diacritics
    .replace(ARABIC_PUNCTUATION, "")
    .replace(NON_SLUG_CHARS, "")
    .replace(/\s+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
}

function isExternal(href: string): boolean {
  return /^https?:\/\//i.test(href)
}

/**
 * Detects a GitHub-style `> [!TIP]` marker and strips it from the tokens in
 * place, so the label is not repeated inside the rendered body.
 * Returns the lowercased variant, or null for a plain blockquote.
 */
function stripAlertMarker(tokens: Tokens.Blockquote["tokens"]): string | null {
  const paragraph = tokens[0]
  if (!paragraph || paragraph.type !== "paragraph") {
    return null
  }

  const inline = (paragraph as Tokens.Paragraph).tokens?.[0]
  if (!inline || (inline.type !== "text" && inline.type !== "escape")) {
    return null
  }

  const textToken = inline as Tokens.Text
  const match = ALERT_MARKER.exec(textToken.text)
  if (!match) {
    return null
  }

  textToken.text = textToken.text.slice(match[0].length)
  textToken.raw = textToken.raw.slice(
    Math.min(match[0].length, textToken.raw.length)
  )

  return match[1].toLowerCase()
}

function alignAttr(align: "center" | "left" | "right" | null): string {
  return align ? ` style="text-align:${align}"` : ""
}

/**
 * Per-article renderer. Heading state is captured in this closure so ids stay
 * unique within one article and the table of contents is collected in the same
 * pass that produces the HTML — the two can never drift apart.
 */
function createRenderer(toc: TocEntry[]): RendererObject {
  const usedIds = new Map<string, number>()

  return {
    heading({ tokens, depth }: Tokens.Heading): string {
      const text = this.parser.parseInline(tokens)
      const plain = text.replace(/<[^>]*>/g, "")

      let id = slugifyHeading(plain)
      if (!id) {
        id = `section-${toc.length + 1}`
      }

      // Two headings with the same wording must not collide.
      const seen = usedIds.get(id) ?? 0
      usedIds.set(id, seen + 1)
      if (seen > 0) {
        id = `${id}-${seen + 1}`
      }

      if (depth === 2 || depth === 3) {
        toc.push({ id, text: plain, depth })
      }

      return `<h${depth} id="${id}">${text}</h${depth}>\n`
    },

    blockquote({ tokens }: Tokens.Blockquote): string {
      const variant = stripAlertMarker(tokens)
      const inner = this.parser.parse(tokens)

      if (!variant) {
        return `<blockquote>${inner}</blockquote>\n`
      }

      const label = ALERT_LABELS[variant] ?? variant
      return (
        `<div class="callout callout--${variant}" role="note">` +
        `<p class="callout__label">${label}</p>` +
        `<div class="callout__body">${inner}</div>` +
        `</div>\n`
      )
    },

    // Implemented in full rather than delegating: inside a renderer object
    // `this` exposes only `parser`, not the sibling tablerow/tablecell methods.
    table(token: Tokens.Table): string {
      const head = token.header
        .map(
          (cell) =>
            `<th${alignAttr(cell.align)}>${this.parser.parseInline(
              cell.tokens
            )}</th>`
        )
        .join("")

      const body = token.rows
        .map(
          (row) =>
            `<tr>${row
              .map(
                (cell) =>
                  `<td${alignAttr(cell.align)}>${this.parser.parseInline(
                    cell.tokens
                  )}</td>`
              )
              .join("")}</tr>`
        )
        .join("")

      // Wide tables must scroll inside their own container, never the page.
      return (
        `<div class="prose-table-wrap"><table>` +
        `<thead><tr>${head}</tr></thead><tbody>${body}</tbody>` +
        `</table></div>\n`
      )
    },

    link({ href, title, tokens }: Tokens.Link): string {
      const text = this.parser.parseInline(tokens)
      const titleAttr = title ? ` title="${title}"` : ""
      const external = isExternal(href)
        ? ` target="_blank" rel="noopener noreferrer"`
        : ""
      return `<a href="${href}"${titleAttr}${external}>${text}</a>`
    },

    image({ href, title, text }: Tokens.Image): string {
      const titleAttr = title ? ` title="${title}"` : ""
      return `<img src="${href}" alt="${text}"${titleAttr} loading="lazy" decoding="async" />`
    },
  }
}

/** Words per minute. Tuned toward Arabic prose, which reads a touch slower. */
const WORDS_PER_MINUTE = 180

export function estimateReadingTime(markdown: string): number {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, " ") // fenced code
    .replace(/`[^`]*`/g, " ") // inline code
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1") // links & images → their text
    .replace(/[#>*_~|-]/g, " ")

  const words = plain.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE))
}

export function renderArticle(markdown: string): {
  html: string
  toc: TocEntry[]
} {
  const toc: TocEntry[] = []
  const marked = new Marked({ gfm: true, breaks: false }).use({
    renderer: createRenderer(toc),
  })

  // `parse` is synchronous unless an async extension is registered.
  const html = marked.parse(markdown) as string

  return { html, toc }
}
