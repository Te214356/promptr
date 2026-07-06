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
const { execSync } = require('child_process')
const os   = require('os')

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

// ─── helpers ─────────────────────────────────────────────────────────────────

function esc(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    // Highlight [variables] in cyan
    .replace(/\[([^\]]+)\]/g, '<span class="var">[$1]</span>')
}

function sectionNum(n) {
  const nums = ['١','٢','٣','٤','٥','٦','٧','٨','٩','١٠','١١','١٢']
  return nums[n] || String(n + 1)
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
      <div class="toc-count">${s.items ? s.items.length + ' عنصر' : ''}</div>
    </div>`).join('')

  const totalItems = d.sections.reduce((sum, s) => sum + (s.items ? s.items.length : 0), 0)

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<style>
/* ── Fonts ─────────────────────────────────────────────────────────────────── */
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;900&display=swap');

/* ── Page setup ─────────────────────────────────────────────────────────────── */
@page { size: A4; margin: 0; }
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
  min-height: 297mm;
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
  background: linear-gradient(135deg, #fff 0%, var(--cyan) 55%, var(--purple) 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text; margin-bottom: 20px; max-width: 150mm;
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
.header-sub { font-size: 8.5pt; color: var(--dim); }

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
}
.toc-note-title { font-size: 9pt; font-weight: 700; color: var(--purple); margin-bottom: 6px; }
.toc-note-body  { font-size: 9pt; color: var(--muted); line-height: 1.7; }

/* ── Content page ─────────────────────────────────────────────────────────── */
.content-page { padding: 14mm 16mm 18mm; }

.sec-header {
  margin-bottom: 20px; padding-bottom: 14px;
  border-bottom: 2px solid var(--purple);
}
.sec-num   { font-size: 7.5pt; font-weight: 700; letter-spacing: 3px; color: var(--purple); text-transform: uppercase; margin-bottom: 5px; }
.sec-title { font-size: 17pt; font-weight: 800; }
.sec-desc  { font-size: 9pt; color: var(--muted); margin-top: 5px; line-height: 1.6; }

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
.box-body    { font-size: 8.5pt; color: var(--muted); line-height: 1.65; }

.style-key-box {
  margin-top: 20px; padding: 14px 16px;
  background: rgba(0,207,255,0.04); border: 1px solid rgba(0,207,255,0.15);
  border-radius: 8px;
}
.style-key-title { font-size: 9pt; font-weight: 800; color: var(--cyan); margin-bottom: 5px; }
.style-key-desc  { font-size: 8.5pt; color: var(--muted); margin-bottom: 10px; }
.style-key-examples { display: flex; flex-direction: column; gap: 5px; }
.style-ex { display: flex; gap: 10px; align-items: flex-start; }
.style-ex-label { font-size: 7.5pt; font-weight: 700; color: var(--purple); white-space: nowrap; min-width: 60px; padding-top: 1px; }
.style-ex-text  { font-size: 8.5pt; color: rgba(255,255,255,0.7); line-height: 1.5; }

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
        <div class="cover-stat-lbl">قسم</div>
      </div>
      <div class="cover-stat">
        <div class="cover-stat-num">${totalItems}</div>
        <div class="cover-stat-lbl">عنصر</div>
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
  ${d.style_key ? `
  <div class="style-key-box">
    <div class="style-key-title">🎛 ${esc(d.style_key.title)}</div>
    <div class="style-key-desc">${esc(d.style_key.description)}</div>
    <div class="style-key-examples">
      ${d.style_key.examples.map(ex => `
      <div class="style-ex">
        <span class="style-ex-label">${esc(ex.label)}</span>
        <span class="style-ex-text">${esc(ex.text)}</span>
      </div>`).join('')}
    </div>
  </div>` : ''}
  <div class="pg-footer">
    <a href="https://promptrsa.com" style="color:inherit;text-decoration:none;">promptrsa.com</a>
    <span class="footer-sep">·</span>
    <span>جميع الحقوق محفوظة © Promptr ${new Date().getFullYear()}</span>
  </div>
</div>

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

const [,, dataFile, outputFile] = process.argv

if (!dataFile || !outputFile) {
  console.error('Usage: node generate.js <data.json> <output.pdf>')
  process.exit(1)
}

const data = JSON.parse(fs.readFileSync(path.resolve(dataFile), 'utf8'))
const html = buildHTML(data)

const tmpHtml = path.join(os.tmpdir(), `promptr-render-${Date.now()}.html`)
fs.writeFileSync(tmpHtml, html, 'utf8')

console.log(`Rendering: ${data.title}`)
console.log(`Sections:  ${data.sections.length} | Items: ${data.sections.reduce((s,x) => s + x.items.length, 0)}`)

try {
  execSync(
    `"${CHROME}" --headless=new --disable-gpu --no-sandbox ` +
    `--print-to-pdf="${path.resolve(outputFile)}" ` +
    `--no-pdf-header-footer ` +
    `--virtual-time-budget=8000 ` +
    `"file://${tmpHtml}"`,
    { stdio: 'pipe' }
  )
  console.log(`✓ PDF saved: ${path.resolve(outputFile)}`)
} finally {
  fs.unlinkSync(tmpHtml)
}
