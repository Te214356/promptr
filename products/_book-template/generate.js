#!/usr/bin/env node
/**
 * Promptr Book PDF Generator (standalone — sibling of products/_template/generate.js,
 * completely independent, do not merge or import from it).
 *
 * Purpose: render long-form Arabic reading books (chapters of prose, not prompt cards)
 * from plain markdown files in /book/*.md into a branded, paginated PDF with real
 * page numbers.
 *
 * Usage:
 *   node generate.js <book-dir> <output.pdf>
 *   node generate.js /Users/abuwessam/promptr/book /Users/abuwessam/promptr/book/output/ai-income-book-draft.pdf
 *
 * Why Puppeteer instead of the Chrome-CLI approach used by products/_template/generate.js:
 * Chrome's `--print-to-pdf` CLI flag does not support custom header/footer templates —
 * only `--no-pdf-header-footer` to kill the default ugly one. CSS Paged Media
 * (`@page { @bottom-center { content: counter(page) } }`) is not implemented in
 * Chromium's print engine at all. The only reliable way to get real page numbers with
 * custom branded styling is Puppeteer's `page.pdf({ displayHeaderFooter, footerTemplate })`,
 * which exposes `<span class="pageNumber"></span>` / `<span class="totalPages"></span>`
 * placeholders that Chromium's DevTools Protocol fills in per physical page.
 *
 * We use puppeteer-core (not full puppeteer) driving the same locally-installed Chrome
 * binary as the sibling template, so no separate Chromium download is required.
 */

const fs = require('fs')
const path = require('path')
const puppeteer = require('puppeteer-core')
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib')

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

// Explicit chapter order — NOT alphabetical/glob order, spelled out deliberately.
const CHAPTER_ORDER = [
  '99-front-matter.md',
  '00-intro.md',
  '01-toolkit.md',
  '02-freelancing.md',
  '03-digital-products.md',
  '04-content-creation.md',
  '05-automation.md',
  '06-ecommerce.md',
  '07-consulting.md',
  '08-micro-agency.md',
  '09-case-study.md',
  '10-plan-90days.md',
  '11-appendix.md',
]

// ─── Footer architecture ─────────────────────────────────────────────────────
// Puppeteer's `displayHeaderFooter` + `footerTemplate` mechanism was abandoned
// entirely after repeated, confirmed rendering bugs specific to that isolated
// frame: a fixed ~14pt unpaintable floor at the true bottom edge regardless of
// margin size, a taller (~22pt) unpaintable strip on the right edge, and
// top:50% percentage centering silently failing (text pinned to the top).
// Patching each one individually produced a visibly doubled/misaligned bar —
// the isolated footer frame simply isn't reliable enough to build on.
//
// New approach: Puppeteer only reserves a *blank* margin.bottom (no
// displayHeaderFooter, no footerTemplate — just a plain, well-tested PDF
// margin with nothing drawn in it). The entire visible footer — bar, page
// number, book title — is then painted directly onto the rendered PDF with
// pdf-lib, which draws straight into the page's own coordinate space and is
// not subject to any of the isolated-frame's quirks.
const MARGIN_TOP = '0mm'      // no header content requested — keep header area collapsed
const BAR_HEIGHT_MM = 8.5     // author spec: 8-9mm visible cyan bar
const MARGIN_BOTTOM = `${BAR_HEIGHT_MM}mm`
const MARGIN_SIDE = '0mm'     // all horizontal spacing handled by in-page CSS padding instead
const PAGE_HEIGHT_MM = 297
// Printable content height per physical page once the footer strip is carved out.
// Only applies to the TOC/chapters document — the cover renders as its own
// separate document with no footer at all, using the full PAGE_HEIGHT_MM.
const PAGE_CONTENT_HEIGHT_MM = PAGE_HEIGHT_MM - BAR_HEIGHT_MM
const PAGE_HEIGHT_PT = (PAGE_HEIGHT_MM / 25.4) * 72
const BAR_HEIGHT_PT = (BAR_HEIGHT_MM / 25.4) * 72

// ─── tiny helpers ────────────────────────────────────────────────────────────

function esc(str) {
  if (str === undefined || str === null) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Inline markdown: currently only **bold** is used in the source files. Escapes
// HTML first, then re-introduces <strong> for the bold spans.
function inline(text) {
  const escaped = esc(text)
  return escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
}

function readBook(bookDir) {
  return CHAPTER_ORDER.map((filename) => {
    const full = path.join(bookDir, filename)
    if (!fs.existsSync(full)) {
      throw new Error(`Expected book file missing: ${full}`)
    }
    return { filename, text: fs.readFileSync(full, 'utf8') }
  })
}

// ─── lightweight markdown block parser ──────────────────────────────────────
// Scope is deliberately narrow — only the constructs actually present (or
// explicitly requested as a precaution) in /book/*.md:
//   #, ##, ### headings · plain paragraphs · **bold** · ordered lists (1. )
//   unordered lists (- ) · markdown tables (| ... | with |---|---| separator)
//   horizontal rules (---) · blockquotes (> ...) as a defensive extra.
// No external markdown library — same "zero logic dependencies" spirit as
// products/_template/generate.js.

function isTableRow(line) {
  return /^\s*\|.*\|\s*$/.test(line)
}
function isTableSeparator(line) {
  return /^\s*\|?[\s:|-]+\|?\s*$/.test(line) && /-/.test(line)
}
function splitTableRow(line) {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '')
  return trimmed.split('|').map((c) => c.trim())
}

function parseBlocks(lines) {
  const blocks = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.trim() === '') {
      i++
      continue
    }

    // Horizontal rule
    if (/^-{3,}\s*$/.test(line.trim())) {
      blocks.push({ type: 'hr' })
      i++
      continue
    }

    // Headings
    let m
    if ((m = /^###\s+(.*)$/.exec(line))) {
      blocks.push({ type: 'h3', text: m[1].trim() })
      i++
      continue
    }
    if ((m = /^##\s+(.*)$/.exec(line))) {
      blocks.push({ type: 'h2', text: m[1].trim() })
      i++
      continue
    }
    if ((m = /^#\s+(.*)$/.exec(line))) {
      blocks.push({ type: 'h1', text: m[1].trim() })
      i++
      continue
    }

    // Blockquote — parsed recursively so multi-paragraph letters, lists and
    // tables nested inside a quote render as real blocks, not one flat line.
    if (/^>\s?/.test(line)) {
      const quoteLines = []
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      blocks.push({ type: 'quote', blocks: parseBlocks(quoteLines) })
      continue
    }

    // Table
    if (isTableRow(line) && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const header = splitTableRow(line)
      i += 2 // skip header + separator
      const rows = []
      while (i < lines.length && isTableRow(lines[i])) {
        rows.push(splitTableRow(lines[i]))
        i++
      }
      blocks.push({ type: 'table', header, rows })
      continue
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      const items = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''))
        i++
      }
      blocks.push({ type: 'ol', items })
      continue
    }

    // Unordered list
    if (/^-\s+/.test(line)) {
      const items = []
      while (i < lines.length && /^-\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^-\s+/, ''))
        i++
      }
      blocks.push({ type: 'ul', items })
      continue
    }

    // Paragraph — accumulate consecutive plain lines until a blank line or
    // the start of another block type.
    const paraLines = [line]
    i++
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^#{1,3}\s+/.test(lines[i]) &&
      !/^-{3,}\s*$/.test(lines[i].trim()) &&
      !/^>\s?/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i]) &&
      !/^-\s+/.test(lines[i]) &&
      !isTableRow(lines[i])
    ) {
      paraLines.push(lines[i])
      i++
    }
    blocks.push({ type: 'p', text: paraLines.join(' ').trim() })
  }

  return blocks
}

function renderBlock(block) {
  switch (block.type) {
    case 'h1':
      // Chapter H1s are consumed separately for the chapter-title page and
      // should never reach here, but keep a safe fallback just in case.
      return `<h1 class="book-h1">${inline(block.text)}</h1>`
    case 'h2':
      return `<h2 class="book-h2">${inline(block.text)}</h2>`
    case 'h3':
      return `<h3 class="book-h3">${inline(block.text)}</h3>`
    case 'p':
      return `<p class="book-p">${inline(block.text)}</p>`
    case 'ol':
      return `<ol class="book-ol">${block.items
        .map((it) => `<li>${inline(it)}</li>`)
        .join('')}</ol>`
    case 'ul':
      return `<ul class="book-ul">${block.items
        .map((it) => `<li>${inline(it)}</li>`)
        .join('')}</ul>`
    case 'quote':
      return `<div class="book-quote">${block.blocks.map(renderBlock).join('')}</div>`
    case 'hr':
      return `<hr class="book-hr">`
    case 'table': {
      const thead = `<thead><tr>${block.header
        .map((c) => `<th>${inline(c)}</th>`)
        .join('')}</tr></thead>`
      const tbody = `<tbody>${block.rows
        .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`)
        .join('')}</tbody>`
      return `<table class="book-table">${thead}${tbody}</table>`
    }
    default:
      return ''
  }
}

// ─── front-matter (99-front-matter.md) — special structured extraction ─────
// Title, subtitle, TOC table and "about" note all come straight out of this
// file's own markdown rather than a JSON schema.

function parseFrontMatter(text) {
  const lines = text.split('\n')
  const blocks = parseBlocks(lines)

  let title = ''
  let subtitle = ''
  let tocRows = []
  let aboutText = ''

  // Walk blocks sequentially, tracking which ## section we're inside.
  let currentSection = null
  for (const block of blocks) {
    if (block.type === 'h1' && !title) {
      title = block.text
      continue
    }
    if (block.type === 'h2') {
      currentSection = block.text
      // The very first H2 encountered (before the TOC/about sections) doubles
      // as the cover subtitle line — it has no body text of its own, the
      // heading text itself *is* the subtitle.
      if (!subtitle && currentSection !== 'فهرس المحتويات' && currentSection !== 'عن هذا الكتاب') {
        subtitle = currentSection
      }
      continue
    }
    if (block.type === 'table' && currentSection === 'فهرس المحتويات') {
      // header is ['#', 'العنوان']
      tocRows = block.rows.map((r) => ({ num: r[0], name: r[1] }))
      continue
    }
    if (block.type === 'p' && currentSection === 'عن هذا الكتاب') {
      aboutText = aboutText ? `${aboutText}\n\n${block.text}` : block.text
      continue
    }
  }

  return { title, subtitle, tocRows, aboutText }
}

// ─── chapter files (00-intro.md .. 11-appendix.md) ──────────────────────────

function parseChapter(filename, text) {
  const numMatch = /^(\d{2})-/.exec(filename)
  const number = numMatch ? numMatch[1] : '??'

  const lines = text.split('\n')
  const h1Match = /^#\s+(.*)$/.exec(lines[0] || '')
  const chapterTitle = h1Match ? h1Match[1].trim() : filename

  // Everything after the H1 line is the chapter body.
  const bodyLines = h1Match ? lines.slice(1) : lines
  const blocks = parseBlocks(bodyLines)
  const bodyHtml = blocks.map(renderBlock).join('\n')

  return { number, title: chapterTitle, bodyHtml }
}

// ─── HTML document assembly ─────────────────────────────────────────────────

// Shared <style> block, parameterized by how tall a single `.page` div's
// printable content area is. The cover is rendered in its own standalone
// document with no footer/margin reserved at all (full 297mm), while the
// TOC/chapters document reserves PAGE_CONTENT_HEIGHT_MM to leave room for
// the footer bar Puppeteer inserts via page.pdf's margin option.
function pageStyles(pageContentHeightMM) {
  return `
/* ── Fonts ─────────────────────────────────────────────────────────────────── */
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;900&display=swap');

/* ── Page setup ────────────────────────────────────────────────────────────── */
/* No @page margin here deliberately: an explicit zero margin was found (via
   direct text-position verification) to make Chromium paginate content as if
   the full 297mm were available, then Puppeteer's own page.pdf margin option
   separately insets the footer band on top of that — pushing the last slice
   of already-computed content into the footer area. Leaving @page margin
   unset lets Puppeteer's margin option be the single source of truth for the
   printable area. */
@page { size: A4; }
* { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:      #080810;
  --purple:  #6C2BFF;
  --cyan:    #00CFFF;
  --white:   #ffffff;
  --muted:   rgba(255,255,255,0.50);
  --dim:     rgba(255,255,255,0.25);
  --faint:   rgba(255,255,255,0.08);
  --border:  rgba(255,255,255,0.09);
}

/* html itself needs the dark background too, not just body — otherwise any
   sub-pixel gap between the html canvas and body's rendered box (seams
   between stacked .page divs, print-engine rounding) shows through as a
   sliver of the PDF's default white page instead of the brand background. */
html {
  background: var(--bg);
}

body {
  font-family: 'Cairo', 'Noto Sans Arabic', 'Geeza Pro', 'SF Arabic', Arial, sans-serif;
  background: var(--bg);
  color: var(--white);
  direction: rtl;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* Every .page div occupies exactly one physical A4 page worth of printable
   area. All internal spacing is padding (keeps the dark background flush to
   every edge) — never margin, which would expose the unpainted page canvas. */
.page {
  width: 210mm;
  min-height: ${pageContentHeightMM}mm;
  page-break-after: always;
  break-after: page;
  position: relative;
}

/* ── Cover ─────────────────────────────────────────────────────────────────── */
.cover {
  background: var(--bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 22mm 20mm;
  text-align: center;
}
.cover-brand {
  font-size: 9pt; font-weight: 700; letter-spacing: 5px;
  color: var(--purple); text-transform: uppercase; margin-bottom: 28px;
}
.cover-line {
  width: 56px; height: 3px;
  background: linear-gradient(90deg, var(--purple), var(--cyan));
  border-radius: 2px; margin-bottom: 36px;
}
.cover-title {
  font-size: 30pt; font-weight: 900; line-height: 1.25;
  color: #00CFFF; margin-bottom: 20px; max-width: 150mm;
}
.cover-subtitle {
  font-size: 12pt; color: var(--muted); line-height: 1.7;
  max-width: 120mm; margin-bottom: 44px;
}
.cover-pill {
  display: inline-flex; align-items: center; gap: 8px;
  background: rgba(108,43,255,0.12); border: 1px solid rgba(108,43,255,0.3);
  border-radius: 20px; padding: 8px 20px;
  font-size: 10pt; font-weight: 700; color: var(--purple);
}

/* ── TOC ──────────────────────────────────────────────────────────────────── */
.toc-page { padding: 20mm 22mm; }
.toc-title { font-size: 20pt; font-weight: 800; margin-bottom: 24px; }

.toc-row {
  display: flex; align-items: flex-start; gap: 14px;
  padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05);
  page-break-inside: avoid; break-inside: avoid;
}
.toc-num {
  min-width: 28px; height: 28px; border-radius: 7px; flex-shrink: 0;
  background: rgba(108,43,255,0.12); border: 1px solid rgba(108,43,255,0.25);
  display: flex; align-items: center; justify-content: center;
  font-size: 8.5pt; font-weight: 700; color: var(--purple); margin-top: 2px;
}
.toc-name { font-size: 11pt; font-weight: 600; color: rgba(255,255,255,0.85); padding-top: 4px; }

.toc-note {
  margin-top: 32px; padding: 14px 16px;
  background: rgba(108,43,255,0.05); border: 1px solid rgba(108,43,255,0.14);
  border-radius: 8px;
  page-break-inside: avoid; break-inside: avoid;
}
.toc-note-title { font-size: 9pt; font-weight: 700; color: var(--purple); margin-bottom: 6px; }
.toc-note-body  { font-size: 9pt; color: var(--muted); line-height: 1.7; }
.toc-note-body p + p { margin-top: 8px; }

/* ── Chapter title page ───────────────────────────────────────────────────── */
.chapter-title-page {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; padding: 22mm 20mm;
}
.chapter-num {
  font-size: 64pt; font-weight: 900; color: var(--purple); line-height: 1;
  margin-bottom: 18px; opacity: 0.9;
}
.chapter-line {
  width: 56px; height: 3px;
  background: linear-gradient(90deg, var(--purple), var(--cyan));
  border-radius: 2px; margin-bottom: 24px;
}
.chapter-title {
  font-size: 22pt; font-weight: 800; color: var(--white); max-width: 140mm; line-height: 1.4;
}

/* ── Chapter body (reading content) ──────────────────────────────────────── */
.chapter-body-page { padding: 20mm 22mm; }

.book-h1 { font-size: 20pt; font-weight: 800; color: var(--white); margin-bottom: 18px; }
.book-h2 {
  font-size: 15pt; font-weight: 800; color: var(--cyan);
  margin-top: 26px; margin-bottom: 14px;
  page-break-after: avoid; break-after: avoid;
  page-break-inside: avoid; break-inside: avoid;
}
.book-h3 {
  font-size: 12.5pt; font-weight: 700; color: var(--cyan);
  margin-top: 20px; margin-bottom: 10px;
  page-break-after: avoid; break-after: avoid;
  page-break-inside: avoid; break-inside: avoid;
}
/* First heading directly under a chapter body shouldn't add extra top gap. */
.chapter-body-page > .book-h2:first-child,
.chapter-body-page > .book-h3:first-child { margin-top: 0; }

.book-p {
  font-size: 17px; line-height: 1.95; color: rgba(255,255,255,0.86);
  margin-bottom: 16px;
}
.book-p strong { color: var(--white); font-weight: 700; }

.book-ol, .book-ul {
  margin-bottom: 16px; padding-right: 22px;
}
.book-ol li, .book-ul li {
  font-size: 17px; line-height: 1.9; color: rgba(255,255,255,0.86);
  margin-bottom: 10px;
}
.book-ol li strong, .book-ul li strong { color: var(--white); font-weight: 700; }
.book-ul li { list-style: disc; }
.book-ol li { list-style: decimal; }

.book-quote {
  border-right: 2px solid var(--purple);
  background: rgba(108,43,255,0.04);
  border-radius: 0 6px 6px 0;
  padding: 12px 16px; margin-bottom: 16px;
  font-size: 16px; line-height: 1.85; color: var(--muted);
  page-break-inside: avoid; break-inside: avoid;
}
.book-quote .book-p {
  font-size: 16px; line-height: 1.85; color: var(--muted);
  margin-bottom: 10px;
}
.book-quote .book-p:last-child { margin-bottom: 0; }
.book-quote .book-ol, .book-quote .book-ul { margin-bottom: 0; }
.book-quote .book-ol li, .book-quote .book-ul li {
  font-size: 16px; line-height: 1.85; color: var(--muted); margin-bottom: 6px;
}
.book-quote .book-table { font-size: 13px; margin-bottom: 0; }

.book-hr {
  border: none; border-top: 1px solid var(--border);
  margin: 22px 0;
}

.book-table {
  width: 100%; border-collapse: collapse;
  margin-bottom: 20px; font-size: 13.5px;
}
.book-table thead { display: table-header-group; }
.book-table th {
  background: rgba(108,43,255,0.08); color: var(--purple);
  font-weight: 700; text-align: right;
  border: 1px solid var(--border); padding: 9px 12px;
}
.book-table td {
  border: 1px solid var(--border); padding: 9px 12px;
  color: rgba(255,255,255,0.82); line-height: 1.6;
}
.book-table tr { page-break-inside: avoid; break-inside: avoid; }
`
}

function documentShell(pageContentHeightMM, bodyInnerHtml) {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<style>
${pageStyles(pageContentHeightMM)}
</style>
</head>
<body>
${bodyInnerHtml}
</body>
</html>`
}

// Cover renders as its own standalone document: no footer, no margin, full
// 297mm page — the only page in the book with neither.
function buildCoverHTML(front) {
  const coverInner = `
<!-- ══ COVER ══════════════════════════════════════════════════════════════════ -->
<div class="page cover">
  <div class="cover-brand">PROMPTR</div>
  <div class="cover-line"></div>
  <div class="cover-title">${inline(front.title)}</div>
  <div class="cover-subtitle">${inline(front.subtitle)}</div>
  <div class="cover-pill">📘 كتاب رقمي</div>
</div>`
  return documentShell(PAGE_HEIGHT_MM, coverInner)
}

// TOC + all chapters render as the second document, printed WITH the footer.
function buildBodyHTML({ front, chapters }) {
  const tocRowsHtml = front.tocRows
    .map(
      (row) => `
    <div class="toc-row">
      <div class="toc-num">${esc(row.num)}</div>
      <div class="toc-name">${esc(row.name)}</div>
    </div>`
    )
    .join('')

  const chaptersHtml = chapters
    .map(
      (ch) => `
<!-- ══ CHAPTER ${ch.number} — TITLE PAGE ═════════════════════════════════════ -->
<div class="page chapter-title-page">
  <div class="chapter-num">${esc(ch.number)}</div>
  <div class="chapter-line"></div>
  <div class="chapter-title">${esc(ch.title)}</div>
</div>

<!-- ══ CHAPTER ${ch.number} — BODY ══════════════════════════════════════════ -->
<div class="page chapter-body-page">
${ch.bodyHtml}
</div>`
    )
    .join('\n')

  const bodyInner = `
<!-- ══ TOC ════════════════════════════════════════════════════════════════════ -->
<div class="page toc-page">
  <div class="toc-title">فهرس المحتويات</div>
  ${tocRowsHtml}
  <div class="toc-note">
    <div class="toc-note-title">عن هذا الكتاب</div>
    <div class="toc-note-body">${front.aboutText.split('\n\n').map((p) => `<p>${inline(p)}</p>`).join('')}</div>
  </div>
</div>

<!-- ══ CHAPTERS ═══════════════════════════════════════════════════════════════ -->
${chaptersHtml}`

  return documentShell(PAGE_CONTENT_HEIGHT_MM, bodyInner)
}

// ─── footer text color ──────────────────────────────────────────────────────
const FOOTER_TEXT_COLOR = '#080810'
// Brand purple (#6C2BFF) was the first color choice, but measured against the
// cyan bar (#00CFFF) its contrast ratio is ~2.1:1 — under WCAG's 3:1 floor
// even for large bold text. Falling back to near-black per the author's own
// fallback instruction, since it reads reliably at 10pt.

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
  const [, , bookDirArg, outputArg] = process.argv
  if (!bookDirArg || !outputArg) {
    console.error('Usage: node generate.js <book-dir> <output.pdf>')
    process.exit(1)
  }

  const bookDir = path.resolve(bookDirArg)
  const outputFile = path.resolve(outputArg)

  const files = readBook(bookDir)

  const frontFile = files.find((f) => f.filename === '99-front-matter.md')
  const front = parseFrontMatter(frontFile.text)

  const chapters = files
    .filter((f) => f.filename !== '99-front-matter.md')
    .map((f) => parseChapter(f.filename, f.text))

  console.log(`Title:    ${front.title}`)
  console.log(`Subtitle: ${front.subtitle}`)
  console.log(`Chapters: ${chapters.length}`)
  console.log(`TOC rows: ${front.tocRows.length}`)

  const coverHtml = buildCoverHTML(front)
  const bodyHtml = buildBodyHTML({ front, chapters })

  fs.mkdirSync(path.dirname(outputFile), { recursive: true })

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
  })

  let coverBytes, bodyBytes
  try {
    // Cover: its own render, no footer/margin at all — the one page in the
    // book with neither the cyan bar nor any reserved margin strip.
    const coverPage = await browser.newPage()
    await coverPage.setContent(coverHtml, { waitUntil: 'load', timeout: 60000 })
    await coverPage.evaluateHandle('document.fonts.ready')
    coverBytes = await coverPage.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: false,
      margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
    })
    await coverPage.close()

    // TOC + chapters: margin.bottom reserves blank space for the footer bar,
    // but nothing is drawn into it here — no displayHeaderFooter, no
    // footerTemplate. pdf-lib paints the entire visible footer afterward.
    const bodyPage = await browser.newPage()
    await bodyPage.setContent(bodyHtml, { waitUntil: 'load', timeout: 60000 })
    await bodyPage.evaluateHandle('document.fonts.ready')
    bodyBytes = await bodyPage.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: false,
      margin: {
        top: MARGIN_TOP,
        bottom: MARGIN_BOTTOM,
        left: MARGIN_SIDE,
        right: MARGIN_SIDE,
      },
    })
    await bodyPage.close()
  } finally {
    await browser.close()
  }

  // Merge the two independently-rendered PDFs into the single final file —
  // this is the only way to give the cover a genuinely different
  // margin configuration than the rest of the book in one page.pdf() call.
  const finalDoc = await PDFDocument.create()
  const coverDoc = await PDFDocument.load(coverBytes)
  const bodyDoc = await PDFDocument.load(bodyBytes)

  const CYAN = rgb(0, 207 / 255, 255 / 255)
  const DARK = rgb(8 / 255, 8 / 255, 15 / 255)

  // A hairline unpaintable sliver was found on the *left* edge of every page
  // rendered by Chromium's normal page/print path — reproduced even on the
  // cover, which uses margin:0 and no footer at all, so it's a Chromium
  // print-rendering quirk unrelated to margins or footers. Patched directly
  // with pdf-lib (which isn't subject to it). 3pt safely covers the ~0.5pt
  // sliver that was measured.
  const LEFT_EDGE_PATCH_PT = 3

  for (const page of coverDoc.getPages()) {
    const { height } = page.getSize()
    page.drawRectangle({ x: 0, y: 0, width: LEFT_EDGE_PATCH_PT, height, color: DARK })
  }

  const pageNumberFont = await bodyDoc.embedFont(StandardFonts.HelveticaBold)
  const PAGE_NUMBER_SIZE = 10

  const bodyPages = bodyDoc.getPages()
  for (let idx = 0; idx < bodyPages.length; idx++) {
    const page = bodyPages[idx]
    const { width, height } = page.getSize()

    // Footer bar, drawn as one solid rectangle directly via pdf-lib — this
    // reaches every edge cleanly on its own (pdf-lib isn't subject to any of
    // Chromium's footer-frame quirks), so no double-layering or patching is
    // needed for the bar itself, unlike the previous footerTemplate approach.
    page.drawRectangle({ x: 0, y: 0, width, height: BAR_HEIGHT_PT, color: CYAN })

    // Page number only — no book title in the bar (removed per author
    // request). Real pdf-lib text (plain digits, no Arabic shaping needed),
    // centered on both axes. The vertical formula below is not purely
    // theoretical: font.heightAtSize(..., {descender:false}) (7.18pt at size
    // 10) put the glyph visibly high (measured via actual rendered bbox vs.
    // bar bounds: 4.94pt above, 5.39pt below — a 0.45pt bias, not the 0
    // symmetry wanted). PDF viewers report a glyph bbox close to the font's
    // full em box regardless of the specific digit's shape, taller than the
    // nominal cap-height. PAGE_NUMBER_Y_NUDGE_PT is that measured correction,
    // re-verified after applying it (see verification notes in project log).
    const numberText = String(idx + 1)
    const textWidth = pageNumberFont.widthOfTextAtSize(numberText, PAGE_NUMBER_SIZE)
    const capHeight = pageNumberFont.heightAtSize(PAGE_NUMBER_SIZE, { descender: false })
    const PAGE_NUMBER_Y_NUDGE_PT = -0.225
    page.drawText(numberText, {
      x: (width - textWidth) / 2,
      y: (BAR_HEIGHT_PT - capHeight) / 2 + PAGE_NUMBER_Y_NUDGE_PT,
      size: PAGE_NUMBER_SIZE,
      font: pageNumberFont,
      color: DARK,
    })

    // Left edge: same hairline patch as the cover, restricted to the area
    // above the bar (the bar itself already reaches x=0 cleanly, drawn above).
    page.drawRectangle({
      x: 0, y: BAR_HEIGHT_PT,
      width: LEFT_EDGE_PATCH_PT, height: height - BAR_HEIGHT_PT,
      color: DARK,
    })
  }

  const [coverPageCopy] = await finalDoc.copyPages(coverDoc, [0])
  finalDoc.addPage(coverPageCopy)

  const bodyPageCopies = await finalDoc.copyPages(bodyDoc, bodyDoc.getPageIndices())
  bodyPageCopies.forEach((p) => finalDoc.addPage(p))

  fs.writeFileSync(outputFile, await finalDoc.save())

  console.log(`✓ PDF saved: ${outputFile}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
