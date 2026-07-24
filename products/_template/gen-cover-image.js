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
  // No data.json for this product (it's a book, built from products/_book-template
  // + book/*.md, not the prompt-pack schema) — title/subtitle/badge are given
  // directly instead of being derived from a data source.
  'ai-income-book': {
    visual: 'book',
    title: 'الذكاء الاصطناعي مصدر دخل',
    subtitle: 'دليلك العملي لسبع طرق مثبتة لبناء دخل حقيقي',
    badgeText: '7 طرق مثبتة',
  },
  'cv-guide-graduates': { visual: 'cv', unit: 'نموذجًا جاهزًا' },
  'marketing-prompts-arabic': { visual: 'marketing', unit: 'برومبتًا' },
  'ecommerce-prompts-arabic': { visual: 'cart', unit: 'برومبتًا' },
  'ai-video-guide-arabic': { visual: 'video', unit: 'نموذجًا' },
  'customer-service-prompts': { visual: 'chat', unit: 'ردًا' },
  'ai-basics-arabic': { visual: 'book', unit: 'درسًا' },
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

function visualBook() {
  // Abstract open book: two page halves angled away from the viewer via a
  // real perspective/rotateY tilt (not just flat rectangles), meeting at a
  // glowing spine that radiates a few faint rising particles — "knowledge
  // radiance" — echoing the orb glows used elsewhere, but as a cluster of
  // small points instead of one big blur. No photorealistic illustration,
  // no currency iconography (unlike the old AI-generated store-image.jpg
  // this replaces).
  const widths = [82, 60, 71, 44, 68]
  const pageLines = (offset) => widths.map((w, i) => {
    const width = ((w + i * offset) % 40) + 45
    return `<div class="book-line" style="width:${width}%"></div>`
  }).join('')
  const particles = [
    { left: 48, top: 6, size: 5, opacity: 0.9 },
    { left: 56, top: -2, size: 4, opacity: 0.7 },
    { left: 42, top: -8, size: 3, opacity: 0.55 },
    { left: 60, top: -16, size: 3, opacity: 0.4 },
    { left: 47, top: -24, size: 2, opacity: 0.3 },
    { left: 53, top: -32, size: 2, opacity: 0.2 },
  ].map(p => `<span class="book-particle" style="left:${p.left}%;top:${p.top}%;width:${p.size}px;height:${p.size}px;opacity:${p.opacity}"></span>`).join('')
  return `
  <div class="visual book-visual">
    <div class="book-glow-beam"></div>
    ${particles}
    <div class="book-pages">
      <div class="book-page book-page-left">${pageLines(3)}</div>
      <div class="book-spine"></div>
      <div class="book-page book-page-right">${pageLines(7)}</div>
    </div>
  </div>`
}

function visualCV() {
  // Abstract CV/resume sheet: a header row (avatar dot + name/title lines),
  // a divider, body lines of varying width (experience/education), and a
  // row of skill-level rings at the bottom — no real photo, no logos.
  const bodyLines = [78, 55, 68, 40, 60].map((w) =>
    `<div class="cv-line" style="width:${w}%"></div>`
  ).join('')
  const skillRings = [0.85, 0.65, 0.9, 0.5, 0.7].map((level) => `
    <div class="cv-skill">
      <svg viewBox="0 0 36 36" class="cv-skill-ring">
        <circle cx="18" cy="18" r="15.5" class="cv-skill-track"/>
        <circle cx="18" cy="18" r="15.5" class="cv-skill-fill" style="stroke-dasharray:${level * 97.4} 97.4"/>
      </svg>
    </div>`
  ).join('')
  return `
  <div class="visual cv-visual">
    <div class="cv-sheet">
      <div class="cv-header-row">
        <div class="cv-avatar"></div>
        <div class="cv-header-lines">
          <div class="cv-line cv-line-name"></div>
          <div class="cv-line cv-line-title"></div>
        </div>
      </div>
      <div class="cv-divider"></div>
      ${bodyLines}
      <div class="cv-skills-row">${skillRings}</div>
    </div>
  </div>`
}

function visualMarketing() {
  // Abstract marketing content: a small fanned stack of ad/post card
  // previews (banner block + caption lines, no real photo/logo) with a
  // glowing upward-growth sparkline badge overlapping the corner.
  const card = (n) => `
    <div class="mkt-card mkt-card-${n}">
      <div class="mkt-card-banner"></div>
      <div class="mkt-card-line" style="width:${68 - n * 6}%"></div>
      <div class="mkt-card-line" style="width:${44 + n * 4}%"></div>
    </div>`
  return `
  <div class="visual marketing-visual">
    ${card(1)}${card(2)}${card(3)}
    <div class="mkt-growth">
      <svg viewBox="0 0 80 50" class="mkt-growth-svg">
        <polyline points="2,42 22,30 42,34 62,14 78,6" class="mkt-growth-line"/>
        <circle cx="78" cy="6" r="3.5" class="mkt-growth-dot"/>
      </svg>
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

function visualCart() {
  // Abstract shopping cart: line-art basket + wheels with 3 product boxes
  // "dropping in" from above, and a glowing price-tag badge overlapping the
  // corner — no real store/brand iconography.
  const boxes = [0, 1, 2].map((n) => `
    <div class="cart-box cart-box-${n + 1}">
      <div class="cart-box-line" style="width:${60 - n * 8}%"></div>
    </div>`).join('')
  return `
  <div class="visual cart-visual">
    ${boxes}
    <svg viewBox="0 0 200 170" class="cart-svg">
      <path d="M14 18 H36 L56 108 H160 L182 44 H50" class="cart-line"/>
      <circle cx="74" cy="140" r="12" class="cart-wheel"/>
      <circle cx="150" cy="140" r="12" class="cart-wheel"/>
    </svg>
    <div class="cart-tag">
      <svg viewBox="0 0 60 60" class="cart-tag-svg">
        <path d="M6 26 L30 6 L54 20 L34 50 Z" class="cart-tag-shape"/>
        <circle cx="24" cy="20" r="4" class="cart-tag-dot"/>
      </svg>
    </div>
  </div>`
}

function visualVideo() {
  // Abstract video-production motif: a glowing play-screen at center, a
  // filmstrip of small frames arcing above it, and an audio-waveform bar
  // beneath — no real app UI or camera iconography.
  const frames = [0, 1, 2, 3].map((n) => `<div class="vid-frame vid-frame-${n + 1}"></div>`).join('')
  const bars = [22, 40, 30, 55, 38, 62, 34, 48, 26].map((h, i) =>
    `<div class="vid-bar" style="height:${h}px; animation-delay:${i * 0.06}s"></div>`
  ).join('')
  return `
  <div class="visual video-visual">
    <div class="vid-filmstrip">${frames}</div>
    <div class="vid-screen">
      <svg viewBox="0 0 60 60" class="vid-play-svg">
        <circle cx="30" cy="30" r="27" class="vid-play-ring"/>
        <path d="M24 18 L44 30 L24 42 Z" class="vid-play-tri"/>
      </svg>
    </div>
    <div class="vid-wave">${bars}</div>
  </div>`
}

const VISUALS = { chat: visualChat, lens: visualLens, grid: visualGrid, book: visualBook, cv: visualCV, marketing: visualMarketing, cart: visualCart, video: visualVideo }

// ─── HTML ────────────────────────────────────────────────────────────────

function buildHTML(data, config, totalItems) {
  // config.badgeText is used verbatim for products with no data.json-derived
  // count (e.g. the book) — otherwise the badge is built from the verified
  // item count + the product's unit word.
  const badgeText = config.badgeText || `${totalItems} ${config.unit}`
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

/* ── book visual ──────────────────────────────────────────────────────── */
.book-visual { position: relative; width: 640px; height: 420px; display: flex; align-items: center; justify-content: center; }
.book-pages {
  display: flex; align-items: stretch; justify-content: center;
  width: 100%; height: 340px;
  perspective: 1000px;
}
.book-page {
  flex: 1; max-width: 300px;
  background: rgba(255,255,255,0.09); border: 1px solid rgba(255,255,255,0.22);
  padding: 34px 30px; display: flex; flex-direction: column; gap: 17px;
  justify-content: center;
  box-shadow: 0 20px 50px rgba(0,0,0,0.35);
}
/* Real perspective tilt (not flat rectangles) — each page rotates away
   from the viewer around its spine-side edge, the two mirrored so they
   read as one open book rather than two flat cards. */
.book-page-left  { border-radius: 22px 4px 4px 22px; transform: rotateY(22deg);  transform-origin: right center; }
.book-page-right { border-radius: 4px 22px 22px 4px; transform: rotateY(-22deg); transform-origin: left center; }
.book-line { height: 10px; border-radius: 5px; background: rgba(255,255,255,0.38); }
.book-spine {
  width: 18px; margin: -1px 0;
  background: linear-gradient(180deg, var(--cyan), var(--purple));
  box-shadow: 0 0 60px 10px rgba(0,207,255,0.6);
  z-index: 1;
}

/* "Knowledge radiance" — small points rising from the glowing spine,
   echoing the page's big orb blurs but as a cluster of particles. */
.book-glow-beam {
  position: absolute; left: 50%; bottom: 55%; width: 60px; height: 260px;
  transform: translateX(-50%);
  background: linear-gradient(180deg, rgba(0,207,255,0.28), rgba(0,207,255,0) 80%);
  filter: blur(10px);
  pointer-events: none;
}
.book-particle {
  position: absolute; border-radius: 50%;
  background: var(--cyan);
  box-shadow: 0 0 12px 3px rgba(0,207,255,0.8);
  pointer-events: none;
}

/* ── cv visual ────────────────────────────────────────────────────────── */
.cv-visual { width: 480px; }
.cv-sheet {
  background: rgba(255,255,255,0.06); border: 1px solid var(--border);
  border-radius: 20px; padding: 34px 32px;
  display: flex; flex-direction: column; gap: 18px;
  box-shadow: 0 0 60px rgba(0,207,255,0.14);
}
.cv-header-row { display: flex; align-items: center; gap: 18px; }
.cv-avatar {
  width: 56px; height: 56px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, var(--purple), var(--cyan));
}
.cv-header-lines { display: flex; flex-direction: column; gap: 10px; flex: 1; }
.cv-line { height: 10px; border-radius: 5px; background: rgba(255,255,255,0.32); }
.cv-line-name  { width: 62%; height: 14px; background: rgba(255,255,255,0.6); }
.cv-line-title { width: 42%; }
.cv-divider { height: 1px; background: var(--border); }
.cv-skills-row { display: flex; justify-content: center; gap: 18px; margin-top: 6px; }
.cv-skill { width: 46px; height: 46px; }
.cv-skill-ring { width: 100%; height: 100%; transform: rotate(-90deg); }
.cv-skill-track { fill: none; stroke: rgba(255,255,255,0.14); stroke-width: 3; }
.cv-skill-fill  { fill: none; stroke: var(--cyan); stroke-width: 3; stroke-linecap: round; }

/* ── marketing visual ────────────────────────────────────────────────── */
.marketing-visual { position: relative; width: 480px; height: 380px; }
.mkt-card {
  position: absolute; width: 210px; height: 250px;
  background: rgba(255,255,255,0.06); border: 1px solid var(--border);
  border-radius: 18px; padding: 18px;
  display: flex; flex-direction: column; gap: 12px;
  box-shadow: 0 20px 45px rgba(0,0,0,0.35);
}
.mkt-card-1 { left: 4px;   top: 70px; transform: rotate(-8deg); z-index: 1; }
.mkt-card-2 { left: 135px; top: 18px; transform: rotate(3deg);  z-index: 2; }
.mkt-card-3 { left: 262px; top: 78px; transform: rotate(10deg); z-index: 1; }
.mkt-card-banner {
  height: 96px; border-radius: 12px;
  background: linear-gradient(135deg, var(--purple), var(--cyan)); opacity: 0.55;
}
.mkt-card-line { height: 9px; border-radius: 5px; background: rgba(255,255,255,0.32); }
.mkt-growth {
  position: absolute; right: -6px; bottom: 4px; width: 112px; height: 74px; z-index: 3;
  background: rgba(0,207,255,0.08); border: 1px solid rgba(0,207,255,0.35);
  border-radius: 16px; box-shadow: 0 0 40px rgba(0,207,255,0.3);
  display: flex; align-items: center; justify-content: center;
}
.mkt-growth-svg { width: 82px; height: 52px; }
.mkt-growth-line { fill: none; stroke: var(--cyan); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.mkt-growth-dot { fill: var(--cyan); }

/* ── cart visual ──────────────────────────────────────────────────────── */
.cart-visual { position: relative; width: 460px; height: 400px; display: flex; align-items: flex-end; justify-content: center; }
.cart-svg { width: 300px; height: 255px; overflow: visible; }
.cart-line { fill: none; stroke: rgba(0,207,255,0.7); stroke-width: 7; stroke-linecap: round; stroke-linejoin: round; filter: drop-shadow(0 0 18px rgba(0,207,255,0.35)); }
.cart-wheel { fill: rgba(8,8,16,0.9); stroke: var(--white); stroke-width: 6; }
.cart-box {
  position: absolute; width: 96px; height: 76px;
  background: rgba(255,255,255,0.07); border: 1px solid var(--border);
  border-radius: 14px; padding: 14px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 14px 30px rgba(0,0,0,0.3);
}
.cart-box-1 { left: 46px;  top: 10px;  transform: rotate(-9deg); }
.cart-box-2 { left: 168px; top: -30px; transform: rotate(4deg); }
.cart-box-3 { left: 290px; top: 6px;   transform: rotate(10deg); }
.cart-box-line { height: 9px; border-radius: 5px; background: rgba(255,255,255,0.34); }
.cart-tag {
  position: absolute; right: 10px; top: 40px; width: 76px; height: 76px; z-index: 3;
  background: rgba(0,207,255,0.08); border: 1px solid rgba(0,207,255,0.35);
  border-radius: 20px; box-shadow: 0 0 40px rgba(0,207,255,0.3);
  display: flex; align-items: center; justify-content: center;
}
.cart-tag-svg { width: 46px; height: 46px; }
.cart-tag-shape { fill: none; stroke: var(--cyan); stroke-width: 4; stroke-linejoin: round; }
.cart-tag-dot { fill: var(--cyan); }

/* ── video visual ─────────────────────────────────────────────────────── */
.video-visual { position: relative; width: 460px; height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 34px; }
.vid-filmstrip { display: flex; gap: 14px; }
.vid-frame {
  width: 62px; height: 44px; border-radius: 8px;
  background: rgba(255,255,255,0.06); border: 1px solid var(--border);
  box-shadow: 0 10px 22px rgba(0,0,0,0.3);
}
.vid-frame-1 { transform: rotate(-7deg) translateY(6px); }
.vid-frame-2 { transform: rotate(3deg) translateY(-4px); }
.vid-frame-3 { transform: rotate(-2deg) translateY(2px); }
.vid-frame-4 { transform: rotate(8deg) translateY(6px); }
.vid-screen {
  width: 150px; height: 150px; border-radius: 30px;
  background: radial-gradient(circle at 40% 35%, rgba(0,207,255,0.16), rgba(8,8,16,0.9) 72%);
  border: 1px solid rgba(0,207,255,0.35);
  box-shadow: 0 0 70px rgba(0,207,255,0.28), inset 0 0 30px rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
}
.vid-play-svg { width: 92px; height: 92px; }
.vid-play-ring { fill: none; stroke: rgba(0,207,255,0.45); stroke-width: 2; }
.vid-play-tri { fill: var(--cyan); filter: drop-shadow(0 0 10px rgba(0,207,255,0.6)); }
.vid-wave { display: flex; align-items: flex-end; gap: 7px; height: 62px; }
.vid-bar {
  width: 8px; border-radius: 4px;
  background: linear-gradient(180deg, var(--cyan), var(--purple));
  opacity: 0.85;
}

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

  let data, totalItems
  if (config.title) {
    // Config-driven product (no data.json backing it) — title/subtitle/badge
    // all come from CONFIGS directly, verified by hand against the source
    // material instead of a data file.
    data = { title: config.title, subtitle: config.subtitle }
    totalItems = null
    console.log(`Product:     ${data.title} (config-driven, no data.json)`)
    console.log(`Visual:      ${config.visual} | Badge: ${config.badgeText}`)
  } else {
    const dataPath = path.resolve(__dirname, '..', productDir, 'data.json')
    data = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
    // Mirrors generate.js's cover-badge count exactly: a `bonus: true`
    // section (e.g. a supplementary checklist) is excluded so the store
    // cover's number always matches the PDF cover's number for the same
    // product — first exercised here by cv-guide-graduates (45 total,
    // 42 advertised after excluding its 3-item bonus section).
    totalItems = data.sections.reduce((sum, s) => sum + (s.bonus ? 0 : (s.items || []).length), 0)

    console.log(`Product:     ${data.title}`)
    console.log(`Price:       ${data.price}`)
    console.log(`Total items: ${totalItems} (from data.json, ${data.sections.length} sections)`)
    console.log(`Visual:      ${config.visual} | Badge: ${totalItems} ${config.unit}`)
  }

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
