# Promptr — Claude Code Project Guide

This file is loaded automatically by Claude Code at the start of every session in this project. It documents the subagent network available in `.claude/agents/` and how agents should collaborate on common tasks.

---

## Subagent Roster

### Code Agents
| Agent | File | Role |
|---|---|---|
| **code-expert** | `code-expert.md` | Implements code changes, debugging, and architecture decisions for the Promptr monorepo (Medusa backend + Next.js storefront). Invoke for any non-trivial implementation task. |
| **code-reviewer** | `code-reviewer.md` | Reviews diffs for correctness, security, and simplification before committing. Always run after code-expert on significant changes. |

### Arabic-Language Business Agents
| Agent | File | Role |
|---|---|---|
| **كاتبي** (katiby) | `katiby.md` | Writes Arabic content: product descriptions, blog posts, marketing copy, social media captions. Matches brand voice for both Promptr and سبعة أصفار. |
| **بريدي** (baridy) | `baridy.md` | Drafts and classifies Arabic/English emails. Triages inbox by urgency and category. |
| **يوتيوبر** (youtuber) | `youtuber.md` | YouTube content strategist for the سبعة أصفار channel. Produces video ideas, hooks, scripts, and thumbnail briefs in Dramatic Gold brand style. |
| **محلل** (muhalil) | `muhalil.md` | Business and data analyst. Synthesises market research and gives bottom-line-first recommendations with explicit tradeoffs. |
| **متابع** (mutabi) | `mutabi.md` | Project and task tracker. Surfaces overdue items, maps dependencies, and maintains status across Promptr and سبعة أصفار. |
| **مصمم** (musammim) | `musammim.md` | Brand and UI design direction (no image generation). Fluent in Promptr's identity (`#080810` / `#6C2BFF` / `#00CFFF`) and سبعة أصفار's Dramatic Gold palette. |
| **مستشار** (mustashar) | `mustashar.md` | Strategic business advisor. Gives honest, balanced counsel on decisions across all ventures — including pushback on bad ideas. |
| **باحث** (bahith) | `bahith.md` | Deep researcher. Verifies facts, cites sources, and produces structured research briefs with content angle suggestions. |

---

## Common Workflows

### Content Creation
```
bahith (research) → katiby (write) → musammim (design/visual notes) → mustashar (strategic review)
```
1. **bahith** — research the topic, produce a structured brief with 3–5 content angles
2. **katiby** — draft the content from the brief
3. **musammim** — add visual direction (if the content ships with design assets)
4. **mustashar** — final sanity check on message, positioning, and brand fit

### YouTube Video (سبعة أصفار)
```
bahith (research) → youtuber (script + title + thumbnail brief) → musammim (thumbnail direction)
```
1. **bahith** — research the angle, verify claims, gather supporting data
2. **youtuber** — write the hook, script, title options, and thumbnail description
3. **musammim** — refine thumbnail visual spec to Dramatic Gold identity

### Code Change
```
code-expert (implement) → code-reviewer (review) → commit & push
```
1. **code-expert** — implement the feature, fix, or refactor
2. **code-reviewer** — review the diff; only commit after reviewer sign-off on significant changes

### Business Decision
```
bahith (research landscape) → muhalil (analyse options) → mustashar (final recommendation)
```
1. **bahith** — gather relevant market/competitor/data context
2. **muhalil** — structure the analysis, quantify tradeoffs
3. **mustashar** — give a clear directional recommendation

### Project Status Check
```
mutabi (status summary) → mustashar (strategic priorities)
```
1. **mutabi** — surface all open items, flag overdue, map blockers
2. **mustashar** — identify which open items matter most given current stage

---

## Project Context

- **Promptr** (`promptrsa.com`) — Medusa v2 e-commerce backend + storefront. Primary stack: TypeScript, Medusa 2.x, Node.js. Payment: Moyasar (SAR). Deployed on Railway.
- **سبعة أصفار** — Arabic YouTube channel. Brand: Dramatic Gold, entrepreneurship/wealth content, Gulf/Saudi audience.
- **Monorepo layout:** `apps/backend` (Medusa), `apps/storefront` (Next.js 15), `.claude/agents/` (subagents), root `package.json` (npm workspaces).
- **Build note:** `ts-node` and `typescript` are in `dependencies` (not devDependencies) — required for Railway production builds.

---

## Railway Deployment — Two Services, Two Methods

Both services live in project **`zoological-hope`** (`b635b9d9-0241-4f5f-bbbd-1b6d2468d2c4`).

| Service | ID | URL | Deploy method |
|---|---|---|---|
| `@dtc/backend` | `cfae7146-9e7b-4f07-8d9f-2f75bdcb7cd1` | `https://dtcbackend-production-32a2.up.railway.app` (also `api.promptrsa.com`) | **Auto** — triggers on every `git push origin main` |
| `storefront` | `f7497b9a-c86b-4c81-ae08-bac368caa0ae` | `https://promptrsa.com` | **Manual** — must run `railway up` from repo root |

**Storefront deploy command (always from repo root):**
```bash
railway up --project b635b9d9-0241-4f5f-bbbd-1b6d2468d2c4 \
           --service  f7497b9a-c86b-4c81-ae08-bac368caa0ae \
           --environment 168a8f3a-cbcc-4765-83f2-d376d3893289
```
Running `railway up` from `apps/storefront` fails — it uploads only the subdirectory and breaks the monorepo start command `cd apps/storefront && next start -p 8000`.

There is also an old crashed service named `promptr` in a separate project (`881899a5`) — ignore it, it is not the live backend.

---

## Digital Product Delivery Pipeline

### Cloudflare R2 Buckets
| Bucket | Access | Purpose |
|---|---|---|
| `promptr-files` | Private (no public URL) | Downloadable PDFs for paying customers |
| Public bucket (pub-8e6feaf…) | Public CDN | Product images / thumbnails |

### Product ↔ R2 file mapping
Set `file_key` in the product's **metadata** field in Medusa Admin. Value = exact filename in `promptr-files`:

| Medusa product handle | `file_key` value |
|---|---|
| `chatgpt-arabic-prompts` | `chatgpt-arabic-prompts.pdf` |
| `chatgpt-prompts-pro-arabic` | `chatgpt-prompts-pro-arabic.pdf` |
| `midjourney-arabic-prompts` | `midjourney-arabic-prompts.pdf` |
| `cv-guide-graduates` | `cv-guide-graduates.pdf` |
| `ai-income-book` | `ai-income-book.pdf` |
| `social-media-templates` | `social-media-templates.pdf` |
| `marketing-prompts-arabic` | `marketing-prompts-arabic.pdf` |
| `ecommerce-prompts-arabic` | `ecommerce-prompts-arabic.pdf` |

### Signed URL generation
`apps/backend/src/utils/signed-url.ts` — generates 7-day presigned GET URLs with `ResponseContentDisposition: attachment`. Uses env vars: `S3_PRIVATE_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_ENDPOINT`, `S3_REGION`.

### Download API
`GET /store/order-downloads?order_id=xxx&email=customer@example.com`
- Requires `x-publishable-api-key` header
- Ownership check: logged-in customer → matches `auth_context.actor_id` vs `order.customer_id`; guest → matches `email` param vs `order.email` (case-insensitive)
- Always returns `403 { message: "unauthorized" }` on failure — never 404 (avoids leaking order existence)
- Returns `{ downloads: [{ product_title, download_url }] }`

### Order confirmation email
`apps/backend/src/subscribers/order-placed.ts` — on `order.placed`:
1. Generates signed URLs for all items with `file_key` in product metadata
2. Sends Arabic RTL email via Resend from `orders@promptrsa.com`
3. Email failure is caught and logged — never breaks order processing
Env vars required: `RESEND_API_KEY`, `RESEND_FROM_EMAIL=orders@promptrsa.com`

### Storefront confirmation page
`apps/storefront/src/modules/order/templates/order-completed-template.tsx` — calls `getOrderDownloads(order.id, order.email)` server-side and renders `<DownloadLinks>` component above order summary. Silent on empty/error.

---

## PDF Generation System

Source: `products/_template/generate.js`
Usage: `node _template/generate.js <product>/data.json <product>/<output>.pdf`

**Active products and page counts:**
| Product dir | PDF filename | Pages |
|---|---|---|
| `chatgpt-arabic-prompts` | `chatgpt-arabic-prompts.pdf` | 55 |
| `midjourney-arabic-prompts` | `midjourney-arabic-prompts.pdf` | 42 |
| `chatgpt-prompts-pro-arabic` | `chatgpt-prompts-pro-arabic.pdf` | 28 |

**Known CSS rules (do not regress):**
- `.card`, `.toc-note`, `.style-key-box` all have `page-break-inside: avoid; break-inside: avoid`
- `.cover-title` uses `color: #00CFFF` — **not** `background-clip: text` (breaks iOS PDF viewer)
- `chatgpt-arabic-prompts` has a standalone page 3 for "مفتاح الأسلوب" (style key), layout: cover → TOC → style-key page → sections

---

## Admin Price Entry Rule

Medusa Admin's price input field operates in **halalas (smallest unit)**, not SAR. When entering or editing any price in Medusa Admin, multiply the SAR amount by 100 (e.g., to set 49 SAR, enter `4900`).

Admin screens showing order totals may display amounts ×100 too large (e.g., a 188 SAR order showing as "18,800") — this is a **display-only bug in the `@medusajs/dashboard` vendor package**, confirmed by direct DB inspection: `price`, `order_line_item`, and `order_summary.totals` all store correct, consistent halala values across every product and every order to date. The storefront and Moyasar checkout always show correct amounts because that code was written by the team with correct halala-aware conversion — Medusa Admin's bundled UI is the only place with the bug.

**Never modify stored values in `price` or `order_summary`** to "correct" this — the data is already correct; the problem is display-only in Admin. Scaling stored amounts would corrupt correct data and break Moyasar refund amounts, storefront prices, and order emails.

---

## Key Environment Variables

### Backend (`@dtc/backend`)
| Variable | Notes |
|---|---|
| `DATABASE_URL` | Railway Postgres |
| `REDIS_URL` | Railway Redis |
| `MOYASAR_PUBLISHABLE_KEY` / `MOYASAR_SECRET_KEY` | Payment |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` / `S3_ENDPOINT` / `S3_REGION` | Cloudflare R2 (shared bucket for images) |
| `S3_BUCKET` | Public image bucket |
| `S3_PRIVATE_BUCKET=promptr-files` | Private PDF bucket |
| `RESEND_API_KEY` | Email delivery |
| `RESEND_FROM_EMAIL=orders@promptrsa.com` | Verified sender (DKIM/SPF/DMARC on promptrsa.com) |

### Storefront (`storefront`)
| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | Safe to commit — also set as Railway var |
| `NEXT_PUBLIC_BASE_URL=https://promptrsa.com` | **Must** be set as Railway var (not only in `.env.production`) — used in `/api/order-complete` redirect; `request.url` in Railway is `http://localhost:PORT` not the public domain |
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` / `MEDUSA_BACKEND_URL` | Backend URL for SSR calls |

---

## Agreed Terminology

| Term | Meaning |
|---|---|
| **منتج رقمي** | Any Medusa product with `metadata.file_key` set |
| **رابط موقّع** | 7-day presigned R2 URL for PDF download |
| **مفتاح الأسلوب** | Style-variable feature in `chatgpt-arabic-prompts`: `[الأسلوب: فصحى رسمية / فصحى مُيسَّرة / خليجية]` |
| **railway up** | Manual storefront deploy — always from repo root with explicit IDs |
| **صفحة التأكيد** | `/[countryCode]/order/[id]/confirmed` — shows download links post-payment |

---

## ملاحظات مؤجلة

- **صفحتان يتيمتان**: `/terms-of-use` و`/return-policy` — نسخ أقدم وأبسط من صفحتي الشروط وسياسة الاسترجاع الكاملتين (`/terms` و`/refund-policy`)، غير مرتبطتين من الفوتر ولا من أي مكان آخر في الكود (تحقّق فعلي في `apps/storefront/src`، تاريخ 2026-07-14). القرار المؤجل: حذفهما أو تحويلهما إلى redirect نحو `/terms` و`/refund-policy` على التوالي.

- **كاش قائمة المنتجات في storefront دائم**: طلب `/store/products` في `apps/storefront/src/lib/data/products.ts` يستخدم `cache: "force-cache"` مع `next.tags` بدون أي `revalidate` زمني — بعكس طلب المناطق في `middleware.ts` الذي له `revalidate: 3600`. الـ tag نفسه مرتبط بكوكي `_medusa_cache_id` الخاص بكل زائر، لكن مفتاح الكاش الفعلي هو الـ URL المتطابق لكل الزوار المجهولين، فأي منتج جديد لن يظهر في `/store` حتى تُعاد تهيئة عملية Next.js. تحقّق فعلي بتاريخ 2026-07-17: منتج `social-media-templates` كان يُرجعه Store API بشكل صحيح (`count`, بيانات، سعر، sales channel — كلها سليمة) لكنه غاب عن HTML الصفحة الحيّة فعليًا حتى بعد تفريغ كوكيز المتصفح (private window)، لأن الكاش على مستوى الخادم وليس المتصفح.
  **الحل المؤقت الموثق**: إعادة نشر الواجهة (`railway up`، الأمر في قسم *Railway Deployment* أعلاه) بعد كل إضافة منتج جديد — يعيد تشغيل العملية ويُفرغ الكاش في الذاكرة.
  **الإصلاح الجذري المؤجل**: إضافة subscriber في الباك إند على أحداث `product.created` / `product.updated` يستدعي route جديد في الواجهة لتنفيذ `revalidateTag()` على تاغ المنتجات تلقائيًا، بدل انتظار نشر يدوي في كل مرة.
