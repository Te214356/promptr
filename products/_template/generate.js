#!/usr/bin/env node
/**
 * Promptr PDF Generator
 * Usage: node generate.js <data.json> <output.pdf>
 * Requires: Google Chrome installed at default macOS path
 *
 * The JSON data schema:
 * {
 *   "title": "اسم المنتج",
 *   "subtitle": "وصف مختصر",
 *   "price": "49 SAR",
 *   "whatsapp": "966XXXXXXXXX",
 *   "usage_note": "تعليمات الاستخدام",
 *   "sections": [
 *     {
 *       "title": "عنوان القسم",
 *       "description": "وصف القسم",
 *       "items": [
 *         {
 *           "title": "عنوان البرومبت",
 *           "useCase": "المجال / الاستخدام",
 *           "prompt": "نص البرومبت مع [متغيرات] للتخصيص",
 *           "output": "مثال المخرجات الفعلية",
 *           "guidance": "متى تستخدمه وماذا تعدّل"
 *         }
 *       ]
 *     }
 *   ]
 * }
 */

const fs   = require('fs')
const path = require('path')
const puppeteer = require('puppeteer-core')
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib')

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

// ─── page margin architecture ───────────────────────────────────────────────
// Ported from products/_book-template/generate.js: Chrome's headless
// `--print-to-pdf` CLI (the old execSync-based approach here) has no way to
// set a real per-physical-page margin at all — CSS `@page { margin }` only
// applies to whichever physical page a `.page` div's box happens to *start*
// on, not to every physical page a tall, multi-card section auto-paginates
// across (confirmed here: a 5-section product renders as 28 pages, so
// sections routinely span several physical pages each). Puppeteer's
// `page.pdf({ margin })` is the only mechanism that reserves space on every
// physical page uniformly. That reserved margin is blank/unpainted by
// Chromium by default (same fact discovered in the book template), so pdf-lib
// paints it dark afterward.
const MARGIN_MM = 16
const MARGIN = `${MARGIN_MM}mm`
const PAGE_HEIGHT_MM = 297
const PAGE_CONTENT_HEIGHT_MM = PAGE_HEIGHT_MM - MARGIN_MM * 2
const PAGE_HEIGHT_PT = (PAGE_HEIGHT_MM / 25.4) * 72
const MARGIN_PT = (MARGIN_MM / 25.4) * 72

// Page-number bar — ported from products/_book-template/generate.js: same
// 8.5mm cyan bar drawn via pdf-lib within the reserved bottom margin, same
// font/size/vertical-centering math (the -0.225pt nudge was measured
// empirically there against HelveticaBold at size 10 specifically, so it
// carries over exactly since both templates use the identical font/size).
const BAR_HEIGHT_MM = 8.5
const BAR_HEIGHT_PT = (BAR_HEIGHT_MM / 25.4) * 72

// ─── helpers ─────────────────────────────────────────────────────────────────

// Chromium's bidi algorithm was found (in the book template) to visibly
// garble Latin words embedded in RTL Arabic text when there's no wrapping
// isolation — e.g. a Latin word directly adjacent to an Arabic character.
// Wrapping every Latin run in dir="ltr" fixes the ordering unconditionally.
// Must run *before* any other tag-inserting step (the variable-highlight
// below, in this file) so its regex never reaches into an already-inserted
// tag's own attribute/class text. The entity alternative keeps it from ever
// matching into the middle of &amp;/&lt;/&gt;/&quot; (which contain Latin
// letters too) — a real corruption bug hit and fixed in the book template.
function wrapLatinRuns(escapedText) {
  return escapedText.replace(/&[a-zA-Z]+;|[A-Za-z][A-Za-z0-9.+#%/_-]*/g, (m) =>
    m.startsWith('&') ? m : `<span dir="ltr">${m}</span>`
  )
}

// Cairo webfont + Chromium shaping bug, found live in this file's own output
// (midjourney-arabic-prompts.pdf cover and its "أدوات محددة" section
// heading): a standalone Arabic waw ("و", the conjunction "and") sitting
// next to a Latin-script run gets shaped into a glyph that reads as a Latin
// "g" instead of و. Swapping in the Unicode presentation-form isolated waw
// (U+FEED) sidesteps the font's contextual substitution and renders
// identically to a normal isolated waw in the all-Arabic case.
//
// Matches a standalone و preceded by whitespace/start-of-string and
// followed by a Latin letter, whitespace, or end-of-string. That lookahead
// is what keeps this from ever touching a genuine Arabic prefix or root
// letter: "والكتاب" (و + الكتاب) and "قوة" (root waw) are both followed by
// another Arabic letter, so neither matches. A و glued directly to a
// following Latin word with no space ("وMidjourney") is still the standalone
// conjunction, just missing its space — this also inserts that space.
// Must run *before* wrapLatinRuns: once a Latin run is wrapped in
// <span dir="ltr">, a glued waw no longer has a Latin letter immediately
// after it to match against — the next character would be "<" instead.
function normalizeIsolatedWaw(text) {
  return text.replace(/(^|\s)و(?=([A-Za-z])|\s|$)/gu, (_, pre, latin) => pre + 'ﻭ' + (latin ? ' ' : ''))
}

function esc(str) {
  if (!str) return ''
  const escaped = String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
  const ltrWrapped = wrapLatinRuns(normalizeIsolatedWaw(escaped))
  // Highlight [variables] in cyan — after Latin-wrapping, so this step's own
  // inserted <span class="var"> tags are never seen by that regex.
  return ltrWrapped.replace(/\[([^\]]+)\]/g, '<span class="var">[$1]</span>')
}

function sectionNum(n) {
  const nums = ['١','٢','٣','٤','٥','٦','٧','٨','٩','١٠','١١','١٢']
  return nums[n] || String(n + 1)
}

// Arabic numeral-noun agreement: counts of 3-10 take the plural noun form
// ("٥ أقسام"); both small counts (1-2) and 11+ take the singular form
// ("٥٠ عنصر" is correct Arabic, not "٥٠ عناصر" — only 3..10 pluralizes).
// Covers the two cases this template actually renders (section count,
// item count), not full declension (no accusative tanween handling needed
// since neither count is ever spoken aloud/inflected here, only printed).
function arabicCountLabel(n, singular, plural) {
  return (n >= 3 && n <= 10) ? plural : singular
}

// ─── card builder ─────────────────────────────────────────────────────────────

function card(item, idx) {
  return `
<div class="card">
  <div class="card-top">
    <span class="tag">برومبت ${idx + 1}</span>
    ${item.useCase ? `<span class="use-case">${esc(item.useCase)}</span>` : ''}
  </div>
  <div class="card-title">${esc(item.title)}</div>

  <div class="prompt-copy-label">📋 انسخ البرومبت</div>
  <div class="prompt-box">${esc(item.prompt)}</div>

  ${item.output ? `
  <div class="output-box">
    <div class="box-label cyan">◆ مثال المخرجات</div>
    <div class="box-body">${esc(item.output)}</div>
  </div>` : ''}

  ${item.guidance ? `
  <div class="guidance-box">
    <div class="box-label purple">▸ متى تستخدمه</div>
    <div class="box-body">${esc(item.guidance)}</div>
  </div>` : ''}
</div>`
}

// ─── section builder ──────────────────────────────────────────────────────────

function section(sec, i) {
  return `
<div class="page content-page">
  <div class="pg-header">
    <span class="brand-dot">PROMPTR</span>
    <span class="header-sep">·</span>
    <span class="header-sub">القسم ${sectionNum(i)}</span>
  </div>

  <div class="sec-header">
    <div class="sec-num">القسم ${sectionNum(i)}</div>
    <div class="sec-title">${esc(sec.title)}</div>
    ${sec.description ? `<div class="sec-desc">${esc(sec.description)}</div>` : ''}
  </div>

  ${sec.items.map((item, j) => card(item, j)).join('\n')}

  <div class="pg-footer">
    <a href="https://promptrsa.com" style="color:inherit;text-decoration:none;">promptrsa.com</a>
    <span class="footer-sep">·</span>
    <span>© Promptr ${new Date().getFullYear()}</span>
  </div>
</div>`
}

// ─── full HTML builder ───────────────────────────────────────────────────────

function buildHTML(d) {
  const tocRows = d.sections.map((s, i) => `
    <div class="toc-row">
      <div class="toc-left">
        <div class="toc-num">${i + 1}</div>
        <div>
          <div class="toc-name">${esc(s.title)}</div>
          ${s.description ? `<div class="toc-sub">${esc(s.description)}</div>` : ''}
        </div>
      </div>
      <div class="toc-count">${s.items ? s.items.length + ' ' + arabicCountLabel(s.items.length, d.item_label || 'عنصر', d.item_label_plural || 'عناصر') : ''}</div>
    </div>`).join('')

  // `bonus: true` on a section (e.g. a supplementary weekly-schedule page)
  // excludes its items from the cover's headline count, so the cover badge
  // matches the product's own advertised total (e.g. "60 قالب") instead of
  // silently including extra planning content that isn't one of the 60
  // sold templates. Both this flag and `item_label` below are optional and
  // default to the original behavior — the three existing prompt-pack
  // products have neither key, so their output is unchanged.
  const totalItems = d.sections.reduce((sum, s) => sum + (s.bonus ? 0 : (s.items ? s.items.length : 0)), 0)

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<style>
/* ── Fonts ─────────────────────────────────────────────────────────────────── */
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;900&display=swap');

/* ── Page setup ─────────────────────────────────────────────────────────────── */
/* No @page margin here deliberately — combining a CSS @page margin with
   Puppeteer's own page.pdf({ margin }) option was found (in the book
   template) to make Chromium paginate as if the full page were available,
   then inset the margin separately on top of that, cutting content off.
   Puppeteer's margin option is the single source of truth for page bounds. */
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

body {
  font-family: 'Cairo', 'Noto Sans Arabic', 'Geeza Pro', 'SF Arabic', Arial, sans-serif;
  background: var(--bg);
  color: var(--white);
  direction: rtl;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.page {
  width: 210mm;
  min-height: ${PAGE_CONTENT_HEIGHT_MM}mm;
  page-break-after: always;
  break-after: page;
  position: relative;
  overflow: hidden;
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

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.18;
  pointer-events: none;
}
.orb-1 { width: 220px; height: 220px; background: var(--purple); top: -60px; right: -40px; }
.orb-2 { width: 180px; height: 180px; background: var(--cyan);   bottom: 80px; left: -30px; }
.orb-3 { width: 120px; height: 120px; background: var(--purple); bottom: 150px; right: 30px; opacity: 0.10; }

.cover-inner { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 0; }

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
.cover-stats {
  display: flex; gap: 24px; margin-top: 20px;
}
.cover-stat {
  text-align: center;
}
.cover-stat-num { font-size: 16pt; font-weight: 900; color: var(--white); }
.cover-stat-lbl { font-size: 8pt; color: var(--dim); margin-top: 2px; }
.cover-footer {
  position: absolute; bottom: 12mm;
  font-size: 8pt; color: var(--dim);
  left: 0; right: 0; text-align: center;
}

/* ── TOC ──────────────────────────────────────────────────────────────────── */
.toc-page { padding: 16mm 18mm 14mm; }

.pg-header {
  display: flex; align-items: center; gap: 10px;
  padding-bottom: 14px; margin-bottom: 28px;
  border-bottom: 1px solid var(--border);
}
.brand-dot  { font-size: 8pt; font-weight: 700; letter-spacing: 3px; color: var(--purple); text-transform: uppercase; }
.header-sep { color: var(--border); }
/* font-weight matches every other small-label element in this file
   (.brand-dot, .sec-num, toc labels — all 700). Left at the CSS default
   (400) before, this specific weight made Cairo's Arabic-Indic "٥" render
   as a thin hollow ring at 8.5pt instead of its normal filled dot —
   legible as "0" at a glance. Confirmed by comparing it against the same
   digit in .sec-num (bold, renders correctly) on the same page. */
.header-sub { font-size: 8.5pt; font-weight: 700; color: var(--dim); }

.toc-title { font-size: 20pt; font-weight: 800; margin-bottom: 24px; }

.toc-row {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05);
}
.toc-left  { display: flex; align-items: flex-start; gap: 14px; }
.toc-num {
  min-width: 28px; height: 28px; border-radius: 7px; flex-shrink: 0;
  background: rgba(108,43,255,0.12); border: 1px solid rgba(108,43,255,0.25);
  display: flex; align-items: center; justify-content: center;
  font-size: 8.5pt; font-weight: 700; color: var(--purple); margin-top: 2px;
}
.toc-name  { font-size: 11pt; font-weight: 600; color: rgba(255,255,255,0.85); }
.toc-sub   { font-size: 8.5pt; color: var(--dim); margin-top: 3px; line-height: 1.5; }
.toc-count { font-size: 8.5pt; color: var(--dim); white-space: nowrap; padding-top: 4px; }

.toc-note {
  margin-top: 32px; padding: 14px 16px;
  background: rgba(108,43,255,0.05); border: 1px solid rgba(108,43,255,0.14);
  border-radius: 8px;
  page-break-inside: avoid; break-inside: avoid;
}
.toc-note-title { font-size: 9pt; font-weight: 700; color: var(--purple); margin-bottom: 6px; }
.toc-note-body  { font-size: 9pt; color: var(--muted); line-height: 1.7; }

/* ── Content page ─────────────────────────────────────────────────────────── */
.content-page { padding: 14mm 16mm 18mm; }

.sec-header {
  margin-bottom: 20px; padding-bottom: 14px;
  border-bottom: 2px solid var(--purple);
  /* Section heading block — the analog of the book template's h2/h3 — must
     not be stranded alone at the bottom of a page with its cards starting
     on the next one. */
  break-after: avoid; page-break-after: avoid;
  break-inside: avoid; page-break-inside: avoid;
}
.sec-num   { font-size: 7.5pt; font-weight: 700; letter-spacing: 3px; color: var(--purple); text-transform: uppercase; margin-bottom: 5px; }
.sec-title { font-size: 17pt; font-weight: 800; }
.sec-desc  { font-size: 9pt; color: var(--muted); margin-top: 5px; line-height: 1.6; orphans: 3; widows: 3; }

/* ── Prompt card ──────────────────────────────────────────────────────────── */
.card {
  background: rgba(255,255,255,0.025);
  border: 1px solid var(--border);
  border-radius: 10px; padding: 14px 16px;
  margin-bottom: 14px;
  page-break-inside: avoid; break-inside: avoid;
}
.card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.tag      { font-size: 7.5pt; font-weight: 700; letter-spacing: 2px; color: var(--purple); text-transform: uppercase; }
.use-case { font-size: 8pt; color: var(--dim); }
.card-title { font-size: 10.5pt; font-weight: 700; margin-bottom: 10px; }

.prompt-box {
  background: rgba(0,0,0,0.45);
  border: 1px solid rgba(108,43,255,0.18);
  border-radius: 6px; padding: 11px 14px;
  font-size: 9pt; color: rgba(255,255,255,0.78);
  line-height: 1.8; margin-bottom: 10px;
  white-space: pre-wrap; word-break: break-word;
}
.var { color: var(--cyan); font-weight: 600; }

.output-box, .guidance-box {
  border-radius: 6px; padding: 9px 12px; margin-bottom: 8px;
}
.output-box  { background: rgba(0,207,255,0.04);  border: 1px solid rgba(0,207,255,0.12); }
.guidance-box{ background: rgba(108,43,255,0.04); border-right: 2px solid var(--purple); border-radius: 0 6px 6px 0; }
.box-label   { font-size: 7pt; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 5px; }
.cyan        { color: var(--cyan); }
.purple      { color: var(--purple); }
.box-body    { font-size: 8.5pt; color: var(--muted); line-height: 1.65; orphans: 3; widows: 3; }

.style-key-box {
  margin-top: 20px; padding: 14px 16px;
  background: rgba(0,207,255,0.04); border: 1px solid rgba(0,207,255,0.15);
  border-radius: 8px;
  page-break-inside: avoid; break-inside: avoid;
}
.style-key-title { font-size: 9pt; font-weight: 800; color: var(--cyan); margin-bottom: 5px; }
.style-key-desc  { font-size: 8.5pt; color: var(--muted); margin-bottom: 10px; }
.style-key-examples { display: flex; flex-direction: column; gap: 5px; }
.style-ex { display: flex; gap: 10px; align-items: flex-start; }
.style-ex-label { font-size: 7.5pt; font-weight: 700; color: var(--purple); white-space: nowrap; min-width: 60px; padding-top: 1px; }
.style-ex-text  { font-size: 8.5pt; color: rgba(255,255,255,0.7); line-height: 1.5; }

/* style-key standalone page */
.style-key-page-desc { font-size: 11pt; color: var(--muted); margin-bottom: 28px; line-height: 1.7; }
.style-key-examples-lg { gap: 14px; }
.style-ex-lg .style-ex-label { font-size: 10pt; min-width: 120px; padding-top: 3px; }
.style-ex-lg .style-ex-text  { font-size: 11pt; line-height: 1.65; }

.prompt-copy-label {
  font-size: 7pt; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;
  color: var(--purple); margin-bottom: 5px; opacity: 0.8;
}

/* ── Page footer ─────────────────────────────────────────────────────────── */
.pg-footer {
  position: absolute; bottom: 9mm; left: 0; right: 0;
  padding: 0 16mm;
  display: flex; align-items: center; gap: 8px;
  font-size: 7.5pt; color: var(--dim);
}
.footer-sep { color: var(--border); }

/* ── Closing ─────────────────────────────────────────────────────────────── */
.closing {
  background: var(--bg);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 20mm; text-align: center;
}
.closing-inner { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; }
.closing-line  { width: 56px; height: 3px; background: linear-gradient(90deg, var(--purple), var(--cyan)); border-radius: 2px; margin-bottom: 28px; }
.closing-title { font-size: 20pt; font-weight: 800; margin-bottom: 12px; }
.closing-sub   { font-size: 10.5pt; color: var(--muted); line-height: 1.75; max-width: 110mm; margin-bottom: 36px; }
.closing-btns  { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
.btn-primary   { background: var(--purple); color: #fff; padding: 10px 26px; border-radius: 8px; font-size: 10pt; font-weight: 700; font-family: inherit; }
.btn-secondary { border: 1px solid rgba(255,255,255,0.18); color: var(--muted); padding: 10px 22px; border-radius: 8px; font-size: 10pt; font-weight: 600; font-family: inherit; }
</style>
</head>
<body>

<!-- ══ COVER ══════════════════════════════════════════════════════════════════ -->
<div class="page cover">
  <div class="orb orb-1"></div>
  <div class="orb orb-2"></div>
  <div class="orb orb-3"></div>
  <div class="cover-inner">
    <div class="cover-brand">PROMPTR · المنتجات الرقمية</div>
    <div class="cover-line"></div>
    <div class="cover-title">${esc(d.title)}</div>
    <div class="cover-subtitle">${esc(d.subtitle)}</div>
    ${d.price ? `<div class="cover-pill">💎 ${esc(d.price)}</div>` : ''}
    <div class="cover-stats">
      <div class="cover-stat">
        <div class="cover-stat-num">${d.sections.length}</div>
        <div class="cover-stat-lbl">${arabicCountLabel(d.sections.length, 'قسم', 'أقسام')}</div>
      </div>
      <div class="cover-stat">
        <div class="cover-stat-num">${totalItems}</div>
        <div class="cover-stat-lbl">${esc(arabicCountLabel(totalItems, d.item_label || 'عنصر', d.item_label_plural || 'عناصر'))}</div>
      </div>
    </div>
  </div>
  <div class="cover-footer"><a href="https://promptrsa.com" style="color:inherit;text-decoration:none;">promptrsa.com</a> · <a href="https://wa.me/${esc(d.whatsapp || '966551859849')}" style="color:inherit;text-decoration:none;">واتساب</a></div>
</div>

<!-- ══ TOC ════════════════════════════════════════════════════════════════════ -->
<div class="page toc-page">
  <div class="pg-header">
    <span class="brand-dot">PROMPTR</span>
    <span class="header-sep">·</span>
    <span class="header-sub">${esc(d.title)}</span>
  </div>
  <div class="toc-title">محتويات الحزمة</div>
  ${tocRows}
  <div class="toc-note">
    <div class="toc-note-title">كيف تستخدم هذه الحزمة؟</div>
    <div class="toc-note-body">${esc(d.usage_note || 'انسخ أي برومبت، عدّل القيم المكتوبة بين [أقواس] حسب نشاطك، والصق في ChatGPT. كل برومبت مُجرَّب ومرفق بمثال مخرجات حقيقي.')}</div>
  </div>
  <div class="pg-footer">
    <a href="https://promptrsa.com" style="color:inherit;text-decoration:none;">promptrsa.com</a>
    <span class="footer-sep">·</span>
    <span>جميع الحقوق محفوظة © Promptr ${new Date().getFullYear()}</span>
  </div>
</div>
${d.style_key ? `
<div class="page toc-page">
  <div class="pg-header">
    <span class="brand-dot">PROMPTR</span>
    <span class="header-sep">·</span>
    <span class="header-sub">${esc(d.title)}</span>
  </div>
  <div class="toc-title">🎛 ${esc(d.style_key.title)}</div>
  <div class="style-key-page-desc">${esc(d.style_key.description)}</div>
  <div class="style-key-examples style-key-examples-lg">
    ${d.style_key.examples.map(ex => `
    <div class="style-ex style-ex-lg">
      <span class="style-ex-label">${esc(ex.label)}</span>
      <span class="style-ex-text">${esc(ex.text)}</span>
    </div>`).join('')}
  </div>
  <div class="pg-footer">
    <a href="https://promptrsa.com" style="color:inherit;text-decoration:none;">promptrsa.com</a>
    <span class="footer-sep">·</span>
    <span>جميع الحقوق محفوظة © Promptr ${new Date().getFullYear()}</span>
  </div>
</div>` : ''}

<!-- ══ SECTIONS ═══════════════════════════════════════════════════════════════ -->
${d.sections.map((s, i) => section(s, i)).join('\n')}

<!-- ══ CLOSING ════════════════════════════════════════════════════════════════ -->
<div class="page closing">
  <div class="orb orb-1"></div>
  <div class="orb orb-2"></div>
  <div class="closing-inner">
    <div class="closing-line"></div>
    <div class="closing-title">شكراً على ثقتك بـ Promptr ✦</div>
    <div class="closing-sub">هذه الحزمة مُحدَّثة باستمرار. أي ملاحظة أو طلب تخصيص — تواصل معنا مباشرة عبر واتساب.</div>
    <div class="closing-btns">
      <a href="https://promptrsa.com" class="btn-primary" style="text-decoration:none;">promptrsa.com</a>
      <a href="https://wa.me/${esc(d.whatsapp || '966551859849')}" class="btn-secondary" style="text-decoration:none;">واتساب · ${esc(d.whatsapp || '966551859849')}</a>
    </div>
  </div>
</div>

</body>
</html>`
}

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
  const [, , dataFile, outputFile] = process.argv

  if (!dataFile || !outputFile) {
    console.error('Usage: node generate.js <data.json> <output.pdf>')
    process.exit(1)
  }

  const data = JSON.parse(fs.readFileSync(path.resolve(dataFile), 'utf8'))
  const html = buildHTML(data)
  const resolvedOutput = path.resolve(outputFile)

  console.log(`Rendering: ${data.title}`)
  console.log(`Sections:  ${data.sections.length} | Items: ${data.sections.reduce((s, x) => s + x.items.length, 0)}`)

  fs.mkdirSync(path.dirname(resolvedOutput), { recursive: true })

  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true })
  let pdfBytes
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'load', timeout: 60000 })
    await page.evaluateHandle('document.fonts.ready')
    pdfBytes = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: false,
      margin: { top: MARGIN, bottom: MARGIN, left: '0mm', right: '0mm' },
    })
  } finally {
    await browser.close()
  }

  // Puppeteer's reserved top/bottom margin is blank/unpainted by Chromium by
  // default — paint it dark on every physical page so it reads as page
  // background instead of a white strip (see the architecture note near
  // MARGIN_MM above). A second, unrelated hairline (~0.5pt, confirmed in the
  // book template on every page including ones with zero margin at all) was
  // found at the true left edge specifically — patched the same way here
  // defensively since it's a generic Chromium print quirk, not specific to
  // any one template.
  const pdfDoc = await PDFDocument.load(pdfBytes)
  const DARK = rgb(8 / 255, 8 / 255, 15 / 255)
  const CYAN = rgb(0, 207 / 255, 255 / 255)
  const LEFT_EDGE_PATCH_PT = 3
  const pageNumberFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const PAGE_NUMBER_SIZE = 10
  const PAGE_NUMBER_Y_NUDGE_PT = -0.225 // measured against this exact font/size in the book template
  const capHeight = pageNumberFont.heightAtSize(PAGE_NUMBER_SIZE, { descender: false })

  const pages = pdfDoc.getPages()
  pages.forEach((p, idx) => {
    const { width, height } = p.getSize()
    p.drawRectangle({ x: 0, y: 0, width, height: MARGIN_PT, color: DARK })
    p.drawRectangle({ x: 0, y: height - MARGIN_PT, width, height: MARGIN_PT, color: DARK })
    p.drawRectangle({ x: 0, y: 0, width: LEFT_EDGE_PATCH_PT, height, color: DARK })

    // Page-number bar on every page except the cover (index 0) — numbering
    // starts at 1 on the first page after the cover, matching the book
    // template's convention.
    if (idx > 0) {
      p.drawRectangle({ x: 0, y: 0, width, height: BAR_HEIGHT_PT, color: CYAN })
      const numberText = String(idx)
      const textWidth = pageNumberFont.widthOfTextAtSize(numberText, PAGE_NUMBER_SIZE)
      p.drawText(numberText, {
        x: (width - textWidth) / 2,
        y: (BAR_HEIGHT_PT - capHeight) / 2 + PAGE_NUMBER_Y_NUDGE_PT,
        size: PAGE_NUMBER_SIZE,
        font: pageNumberFont,
        color: DARK,
      })
    }
  })

  fs.writeFileSync(resolvedOutput, await pdfDoc.save())
  console.log(`✓ PDF saved: ${resolvedOutput}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
