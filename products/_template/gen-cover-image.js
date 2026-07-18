#!/usr/bin/env node
/**
 * Promptr Store Cover Image Generator
 * Usage: node gen-cover-image.js <product-dir-name> <output.png>
 *
 * Reads title/subtitle/price/item-count straight from that product's
 * data.json (same schema as generate.js) — never hardcode numbers here.
 * Renders a 1200x1200 PNG matching the social-media-templates store-image
 * identity: #080810 bg, purple/cyan orb glows, PROMPTR wordmark, big cyan
 * Cairo title, one abstract visual per product, count badge pill.
 */

const fs = require('fs')
const path = require('path')
const puppeteer = require('puppeteer-core')

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const SIZE = 1200

// Per-product design choices (visual motif + badge unit word). Not derived
// from data.json because these are copy/design decisions, not data — the
// *number* in the badge always comes from data.json's actual item count.
const CONFIGS = {
  'chatgpt-prompts-pro-arabic': { visual: 'chat', unit: 'برومبت' },
  'midjourney-arabic-prompts': { visual: 'lens', unit: 'عنصرًا' },
  'chatgpt-arabic-prompts': { visual: 'grid', unit: 'أمر' },
}

// ─── bidi + escaping — ported verbatim from generate.js ────────────────────
function wrapLatinRuns(escapedText) {
  return escapedText.replace(/&[a-zA-Z]+;|[A-Za-z][A-Za-z0-9.+#%/_-]*/g, (m) =>
    m.startsWith('&') ? m : `<span dir="ltr">${m}</span>`
  )
}

// Cairo webfont + Chromium shaping bug (confirmed by rasterizing the
// already-shipped midjourney-arabic-prompts.pdf cover — same glitch is live
// there): a standalone Arabic waw ("و", the conjunction "and") sitting next
// to a Latin-script run gets shaped into a glyph that reads as a Latin "g"
// instead of و. Swapping in the Unicode presentation-form isolated waw
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
  // Must run before wrapLatinRuns: once a Latin run is wrapped in
  // <span dir="ltr">, a waw glued directly to it ("وMidjourney") no longer
  // has a Latin letter immediately after it to match against — the next
  // character would be "<" instead.
  return wrapLatinRuns(normalizeIsolatedWaw(escaped))
}

// ─── abstract visuals (no real logos — pure CSS/SVG shapes) ────────────────

function visualChat() {
  // Abstract chat window: two message bubbles (incoming/outgoing) with a
  // window chrome bar of three neutral dots — no messaging-app branding.
  return `
  <div class="visual chat-visual">
    <div class="chat-window">
      <div class="chat-bar">
        <span class="dot"></span><span class="dot"></span><span class="dot"></span>
      </div>
      <div class="chat-body">
        <div class="bubble bubble-in">
          <div class="line" style="width:70%"></div>
          <div class="line" style="width:45%"></div>
        </div>
        <div class="bubble bubble-out">
          <div class="line" style="width:60%"></div>
        </div>
        <div class="bubble bubble-in">
          <div class="line" style="width:80%"></div>
          <div class="line" style="width:35%"></div>
        </div>
      </div>
    </div>
  </div>`
}

function visualLens() {
  // Abstract glowing lens/aperture: concentric rings + aperture blades —
  // no camera-brand iconography.
  return `
  <div class="visual lens-visual">
    <div class="lens-ring lens-ring-1"></div>
    <div class="lens-ring lens-ring-2"></div>
    <div class="lens-ring lens-ring-3"></div>
    <div class="lens-core">
      <div class="blade blade-1"></div>
      <div class="blade blade-2"></div>
      <div class="blade blade-3"></div>
      <div class="blade blade-4"></div>
      <div class="blade blade-5"></div>
      <div class="blade blade-6"></div>
    </div>
  </div>`
}

function visualGrid() {
  // Abstract grid of mini command cards — generic line + chevron glyphs,
  // no real app UI.
  const cells = Array.from({ length: 9 }, (_, i) => {
    const highlighted = i === 4
    return `<div class="cmd-card${highlighted ? ' cmd-card-active' : ''}">
      <span class="cmd-chevron">›</span>
      <div class="cmd-line" style="width:${55 + ((i * 13) % 30)}%"></div>
    </div>`
  }).join('')
  return `<div class="visual grid-visual">${cells}</div>`
}

const VISUALS = { chat: visualChat, lens: visualLens, grid: visualGrid }

// ─── HTML ────────────────────────────────────────────────────────────────

function buildHTML(data, config, totalItems) {
  const badgeText = `${totalItems} ${config.unit}`
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:      #080810;
  --purple:  #6C2BFF;
  --cyan:    #00CFFF;
  --white:   #ffffff;
  --muted:   rgba(255,255,255,0.55);
  --dim:     rgba(255,255,255,0.25);
  --border:  rgba(255,255,255,0.12);
  --card:    rgba(255,255,255,0.05);
}

html, body {
  width: ${SIZE}px; height: ${SIZE}px;
  background: var(--bg);
  overflow: hidden;
}

body {
  font-family: 'Cairo', 'Noto Sans Arabic', 'Geeza Pro', 'SF Arabic', Arial, sans-serif;
  color: var(--white);
  direction: rtl;
  -webkit-print-color-adjust: exact;
}

.frame {
  position: relative;
  width: ${SIZE}px; height: ${SIZE}px;
  display: flex; flex-direction: column; align-items: center;
  padding: 70px 90px 60px;
}

.orb { position: absolute; border-radius: 50%; filter: blur(110px); pointer-events: none; }
.orb-1 { width: 420px; height: 420px; background: var(--purple); top: -140px; right: -120px; opacity: 0.30; }
.orb-2 { width: 380px; height: 380px; background: var(--cyan);   bottom: -120px; left: -110px; opacity: 0.24; }
.orb-3 { width: 260px; height: 260px; background: var(--purple); bottom: 260px; right: 60px; opacity: 0.14; }

.content { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; width: 100%; height: 100%; }

.brand {
  font-size: 20px; font-weight: 700; letter-spacing: 7px;
  color: var(--white); text-transform: uppercase; margin-bottom: 34px;
}

.title {
  font-size: 52px; font-weight: 900; line-height: 1.22;
  color: var(--cyan); text-align: center; max-width: 920px;
  margin-bottom: 20px;
}

.subtitle {
  font-size: 21px; color: var(--muted); line-height: 1.65;
  text-align: center; max-width: 760px; margin-bottom: 48px;
}

.visual-wrap {
  flex: 1; width: 100%;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 40px;
}

/* ── chat visual ─────────────────────────────────────────────────────── */
.chat-visual { width: 520px; }
.chat-window {
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border);
  border-radius: 28px;
  box-shadow: 0 0 60px rgba(0,207,255,0.18);
  overflow: hidden;
}
.chat-bar {
  display: flex; gap: 10px; padding: 20px 24px;
  border-bottom: 1px solid var(--border);
}
.chat-bar .dot { width: 12px; height: 12px; border-radius: 50%; background: rgba(255,255,255,0.18); }
.chat-body { padding: 36px 28px; display: flex; flex-direction: column; gap: 20px; }
/* Explicit width (not just max-width) — a shrink-to-fit flex item with only
   max-width resolves its percentage-width children to ~0 in Chromium, which
   collapsed these into tiny blobs before this fix. */
.bubble { width: 340px; border-radius: 18px; padding: 18px 22px; display: flex; flex-direction: column; gap: 12px; }
.bubble-in  { align-self: flex-start; background: rgba(255,255,255,0.08); border-bottom-left-radius: 4px; }
.bubble-out { align-self: flex-end; width: 260px; background: linear-gradient(135deg, rgba(108,43,255,0.4), rgba(0,207,255,0.4)); border-bottom-right-radius: 4px; }
.bubble .line { height: 11px; border-radius: 6px; background: rgba(255,255,255,0.4); }

/* ── lens visual ─────────────────────────────────────────────────────── */
.lens-visual { position: relative; width: 420px; height: 420px; display: flex; align-items: center; justify-content: center; }
.lens-ring { position: absolute; border-radius: 50%; border: 2px solid rgba(0,207,255,0.35); }
.lens-ring-1 { width: 420px; height: 420px; box-shadow: 0 0 70px rgba(0,207,255,0.25); }
.lens-ring-2 { width: 320px; height: 320px; border-color: rgba(108,43,255,0.4); }
.lens-ring-3 { width: 230px; height: 230px; border-color: rgba(255,255,255,0.18); }
.lens-core { position: relative; width: 140px; height: 140px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, rgba(0,207,255,0.5), rgba(8,8,16,0.9) 70%); box-shadow: inset 0 0 30px rgba(0,0,0,0.6); }
.blade { position: absolute; width: 70px; height: 70px; background: rgba(255,255,255,0.05); top: 50%; left: 50%; transform-origin: 0 0; clip-path: polygon(0 0, 100% 0, 0 100%); }
.blade-1 { transform: rotate(0deg) translate(0,0); }
.blade-2 { transform: rotate(60deg) translate(0,0); }
.blade-3 { transform: rotate(120deg) translate(0,0); }
.blade-4 { transform: rotate(180deg) translate(0,0); }
.blade-5 { transform: rotate(240deg) translate(0,0); }
.blade-6 { transform: rotate(300deg) translate(0,0); }

/* ── grid visual ─────────────────────────────────────────────────────── */
.grid-visual { width: 480px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.cmd-card {
  background: var(--card); border: 1px solid var(--border); border-radius: 14px;
  padding: 16px; display: flex; flex-direction: column; gap: 10px;
  height: 100px; justify-content: center;
}
.cmd-card-active { background: rgba(0,207,255,0.08); border-color: rgba(0,207,255,0.5); box-shadow: 0 0 30px rgba(0,207,255,0.25); }
.cmd-chevron { color: var(--cyan); font-weight: 900; font-size: 20px; }
.cmd-line { height: 8px; border-radius: 4px; background: rgba(255,255,255,0.28); }

/* ── badge pill ───────────────────────────────────────────────────────── */
.badge {
  display: inline-flex; align-items: center; gap: 10px;
  background: linear-gradient(90deg, var(--purple), var(--cyan));
  border-radius: 999px; padding: 16px 40px;
  font-size: 24px; font-weight: 900; color: var(--white);
  box-shadow: 0 8px 30px rgba(0,207,255,0.25);
}
</style>
</head>
<body>
  <div class="frame">
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>
    <div class="content">
      <div class="brand">PROMPTR</div>
      <div class="title">${esc(data.title)}</div>
      <div class="subtitle">${esc(data.subtitle)}</div>
      <div class="visual-wrap">${VISUALS[config.visual]()}</div>
      <div class="badge">${esc(badgeText)}</div>
    </div>
  </div>
</body>
</html>`
}

// ─── main ────────────────────────────────────────────────────────────────

async function main() {
  const [, , productDir, outputFile] = process.argv
  if (!productDir || !outputFile) {
    console.error('Usage: node gen-cover-image.js <product-dir-name> <output.png>')
    process.exit(1)
  }

  const config = CONFIGS[productDir]
  if (!config) {
    console.error(`No visual config for "${productDir}". Known: ${Object.keys(CONFIGS).join(', ')}`)
    process.exit(1)
  }

  const dataPath = path.resolve(__dirname, '..', productDir, 'data.json')
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
  const totalItems = data.sections.reduce((sum, s) => sum + (s.items || []).length, 0)

  console.log(`Product:     ${data.title}`)
  console.log(`Price:       ${data.price}`)
  console.log(`Total items: ${totalItems} (from data.json, ${data.sections.length} sections)`)
  console.log(`Visual:      ${config.visual} | Badge: ${totalItems} ${config.unit}`)

  const html = buildHTML(data, config, totalItems)
  const resolvedOutput = path.resolve(outputFile)
  fs.mkdirSync(path.dirname(resolvedOutput), { recursive: true })

  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true })
  try {
    const page = await browser.newPage()
    await page.setViewport({ width: SIZE, height: SIZE, deviceScaleFactor: 1 })
    await page.setContent(html, { waitUntil: 'load', timeout: 60000 })
    await page.evaluateHandle('document.fonts.ready')
    await page.screenshot({ path: resolvedOutput, type: 'png' })
  } finally {
    await browser.close()
  }

  console.log(`Saved: ${resolvedOutput}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
