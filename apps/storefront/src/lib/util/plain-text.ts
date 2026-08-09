/**
 * Product descriptions are authored with Markdown and hard line breaks. Neither
 * belongs in a meta description or in JSON-LD, where the value is read as a
 * single plain string.
 */
export const toPlainText = (input?: string | null): string => {
  if (!input) {
    return ""
  }

  return input
    .replace(/```[\s\S]*?```/g, " ") // fenced code
    .replace(/`([^`]*)`/g, "$1") // inline code
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1") // images -> alt text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links -> label
    .replace(/^\s{0,3}#{1,6}\s+/gm, "") // headings
    .replace(/^\s{0,3}[-*+]\s+/gm, "") // bullets
    .replace(/^\s{0,3}\d+[.)]\s+/gm, "") // numbered list markers
    .replace(/^\s{0,3}>\s?/gm, "") // blockquotes
    .replace(/(\*\*|__)(.*?)\1/g, "$2") // bold
    .replace(/(\*|_)(.*?)\1/g, "$2") // italics
    .replace(/~~(.*?)~~/g, "$1") // strikethrough
    .replace(/\s+/g, " ") // collapse newlines and runs of space
    .trim()
}

/**
 * Truncate on a word boundary so a meta description never ends mid-word.
 * `max` counts characters including the ellipsis.
 */
export const truncate = (input: string, max: number): string => {
  if (input.length <= max) {
    return input
  }

  const clipped = input.slice(0, max - 1)
  const lastSpace = clipped.lastIndexOf(" ")

  return `${(lastSpace > max * 0.6 ? clipped.slice(0, lastSpace) : clipped).trimEnd()}…`
}
