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

### 🔑 متغيرات البيئة وقت البناء — تُعلَن في `turbo.json` وإلا اختفت

البناء يمرّ عبر **turbo** من جذر المونوريبو، و**Turbo 2 يعمل بـ`envMode: strict` افتراضيًا**: المهمة لا تستلم إلا المتغيرات المعلَنة صراحةً. مهمة `build` في `turbo.json` تُعلن الآن خمسة:

```
MEDUSA_BACKEND_URL · NEXT_PUBLIC_MEDUSA_BACKEND_URL
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY · NEXT_PUBLIC_BASE_URL · NEXT_PUBLIC_DEFAULT_REGION
```

> **قاعدة:** أي متغير جديد يحتاجه **البناء** (لا التشغيل فقط) يجب أن يُضاف إلى هذه القائمة **وأن يكون مضبوطًا كمتغير خدمة على Railway**. الاثنان معًا؛ أحدهما وحده لا يكفي.
>
> اختُير `env` لا `passThroughEnv` عمدًا: هذه القيم تُخبز في مخرَج البناء، فيجب أن تدخل بصمة الكاش — وإلا أعاد turbo استخدام بناء قديم بعد تغيير إحداها.

**كيف انكشف هذا (2026-08-11) — تفاعل بين تغييرين صحيحين:** لم يكن في `turbo.json` أي إعلان `env` منذ البداية، لكن العطل كان **مستترًا** لأن `apps/storefront/.env.production` كان متتبَّعًا في git ويحوي المتغيرات نفسها — و**Next يقرأ ملفات `.env` بنفسه بعد بدء العملية، فلا يمسّه فلتر turbo**. وحين أُزيل الملف من التتبع (كوميت `be027d9`، وهو إصلاح أمني صحيح) اختفى الالتفاف وظهر الحجب: بناء Railway فقد الخمسة، فشُحنت `sitemap.xml` **بلا أي صفحة منتج**، ولم يُكتشف إلا من تصدير Search Console.

**تشخيص هذه الفئة من الأعطال:**
```bash
npx turbo build --filter=@dtc/storefront --dry=json   # declared env: [] ⟵ حجب
railway logs --build <DEPLOYMENT_ID> | grep "\[sitemap\]"
```
> ⚠️ **الفحص المحلي وحده يخدع:** `.env.local` على جهازك يجعل البناء ينجح مهما فلتر turbo. اختبر عبر سجل بناء Railway، لا عبر بنائك.
>
> و`turbo.json` **لا يقبل مفاتيح غير معروفة** — لا تضع تعليقًا بصيغة `"// key"`، يفشل التحليل. وثّق هنا بدلًا منه.

---

## 📌 نقطة استئناف — آخر تحديث 2026-08-08

**أُنجز:**

| المجال | ما تم |
|---|---|
| المحتوى | **17 مقالًا منشورًا** (تجاوز عتبة AdSense)، بأشكال غير مكررة وربط داخلي متبادل |
| الواجهة | سلايدر بنرات في الرئيسية · إصلاح السلة الفارغة (كانت 404) · إزالة شريط «قسم AI» الميت |
| **الزحف والفهرسة** | **كسر حلقة حجب الزواحف** (كوكي `_medusa_cache_id`) · **إعادة كتابة الجذر** بدل تحويله — كانا يحجبان الموقع كليًا عن كل زاحف |
| Search Console | موثّق بملف HTML · `sitemap.xml` مُرسَل · الرئيسية مفهرسة |
| AdSense | **الملكية مثبتة** بالعلامة الوصفية · `ads.txt` منشور · **المراجعة جارية** · صفر وحدة إعلانية |
| الأمان | إغلاق **ثغرة مقارنة المبلغ** (كانت قابلة للاستغلال) · تشديد روابط التحميل (48 ساعة + حد 15/10د) · HSTS |

**المتبقي — بترتيب سهولة الإنجاز:**

1. **البند 3** — تعطيل `Public Development URL` لـ`promptr-files` في لوحة Cloudflare. **يدوي، دقيقتان**، ولا يحتاج كودًا.
2. **البند 1** — تنظيف كلمة مرور الأدمن القديمة من تاريخ git (`754c9a1`). **ينتظر قرارك** بشأن إعادة كتابة التاريخ وتبعاتها على النسخ المستنسخة.
3. **البند 4** — تحقق توقيع webhook (HMAC). **ينتظر سرّ التوقيع من لوحة Moyasar**؛ الكود محمي حاليًا بتحذير صريح فوق `getWebhookActionAndData` — لا تصحّح قراءة الحمولة بمعزل عنه.
4. **`Content-Security-Policy`** — مؤجل بقرار. يُبدأ بـ`Report-Only` أولًا لأن الموقع يحمّل AdSense وصور R2 وخط Cairo، وسياسة خاطئة تكسر الإعلانات أو الدفع بصمت.

> البنود 1 و3 و4 هي ما تبقّى من **قائمة ما قبل تفعيل Moyasar الحي** (مع البند 5: مراجعة بشرية). البندان 2 و6 مغلقان.

---

## 🚨 قاعدة فحص إلزامية: اختبر بلا جرّة كوكيز قبل الحكم على ما يراه الزاحف

**السبب الجذري (2026-08-06):** كان `middleware.ts` — في فرع «رمز الدولة موجود والكوكي غائب» — يضبط كوكي `_medusa_cache_id` **ويحوّل 307 إلى نفس العنوان** (`/sa → /sa`). هذا ينتهي فقط لعميل يحفظ الكوكي ويعيد إرساله. **الزواحف لا تحفظ الكوكيز**، فتدور بلا نهاية.

**الأثر — أوسع بكثير من AdSense:**
- كل زاحف كان **محجوبًا عن كل صفحة HTML** في الموقع منذ نشره: `curl -L` بلا كوكيز يستهلك 50 تحويلة ويستلم **صفر بايت**.
- الفهرسة معطّلة تمامًا رغم `sitemap.xml` سليم و`robots.txt` سليم و17 مقالًا منشورًا.
- ثلاث محاولات إثبات ملكية AdSense رُفضت، وضلّلنا أن `robots.txt` و`sitemap.xml` و`ads.txt` تعمل — لأنها مسارات ذات نقطة تتخطى الـmiddleware أصلًا، فبدا الموقع مقروءًا وهو ليس كذلك.

**الإصلاح:** ضبط الكوكي على `NextResponse.next()` بدل التحويل، فتصل الصفحة والكوكي في استجابة واحدة (كوميت `c3dd871`). تحقق على الإنتاج بلا كوكيز: `/sa` و`/sa/blog` و`/sa/store` وصفحة مقال — **200 بصفر تحويلات**، وكذلك بهويات `Mediapartners-Google` و`AdsBot-Google` و`Googlebot`.

> ### القاعدة
>
> **أي فحص لما يراه زاحف أو خدمة خارجية يجب أن يُنفَّذ بلا `-c/-b`.** جرّة الكوكيز في `curl` تُخفي هذه الفئة من الأعطال بالكامل — وقد أخفتها طوال جلسات: كل فحوصنا كانت تُظهر 200 لأننا كنا نحفظ الكوكي، بينما الزاحف يرى حلقة لا نهائية.
>
> ```bash
> # ما يراه الزاحف فعلًا — لا تضف جرّة كوكيز
> curl -s -o /dev/null -w "%{http_code} redirects=%{num_redirects}\n" https://promptrsa.com/sa
> curl -s -A "Googlebot" -o /dev/null -w "%{http_code} redirects=%{num_redirects}\n" https://promptrsa.com/sa
> ```
>
> **المتوقع: `200 redirects=0`.** أي تحويلة تعتمد على كوكي في مسار HTML = عطل فهرسة، لا تفصيل تقني.
>
> وإذا ظهر «307 غامض» في أي فحص، **فهو عرَض يستحق التتبع** لا خطأ في أمر الفحص يُعالَج بإضافة جرّة كوكيز.

### الجذر `/` يُعاد كتابته لا يُحوَّل (2026-08-06)

بعد كسر الحلقة أعلاه بقي الجذر يُرجع **307 إلى `/sa`**، والتحقق ظل يفشل: **Google تتحقق من العنوان بالضبط** (`promptrsa.com`)، فلم تكن العلامة الوصفية على العنوان المفحوص أصلًا.

الحل في `middleware.ts` (كوميت `2c8d8be`): الجذر وحده يُعاد كتابته داخليًا (`NextResponse.rewrite`) إلى `/${countryCode}`، فيُقدَّم محتوى المنطقة الافتراضية **على `/` نفسه بحالة 200 وبصفر تحويلات**. الكوكي يُضبط على نفس الاستجابة إن كان غائبًا.

**المسارات المجرّدة الأعمق (`/blog`، `/store`) تبقى 307 عمدًا** — إعادة كتابتها كلها تعني تقديم كل صفحة تحت عنوانين، بينما `sitemap.xml` والـcanonical يسمّيان صيغة `/:countryCode`.

> ⚠️ **خطر يجب فحصه عند أي تعديل على إعادة الكتابة:** `LocalizedClientLink` يقرأ `useParams().countryCode`. لو لم يصل الطلب إلى مسار `[countryCode]` لانكسرت كل روابط التنقّل إلى `/undefined/...`. الفحص المطلوب بعد أي تغيير: `curl` للجذر ثم عدّ `‎/undefined/‎` في الناتج — **يجب أن يكون صفرًا** (كان صفرًا وقت التنفيذ، والروابط تحمل `/sa/` سليمة).

---

## Railway Deployment — Two Services, Two Methods

Both services live in project **`zoological-hope`** (`b635b9d9-0241-4f5f-bbbd-1b6d2468d2c4`).

| Service | ID | URL | Deploy method |
|---|---|---|---|
| `@dtc/backend` | `cfae7146-9e7b-4f07-8d9f-2f75bdcb7cd1` | `https://dtcbackend-production-32a2.up.railway.app` (also `api.promptrsa.com`) | **Auto** — triggers on every `git push origin main` |
| `storefront` | `f7497b9a-c86b-4c81-ae08-bac368caa0ae` | `https://promptrsa.com` | **Auto** on `git push origin main` (تحقّق 2026-07-30، انظر التصحيح أدناه) + **`railway up`** يدويًا من جذر الريبو لنشر تغييرات غير مكوميتة أو إجبار إعادة بناء |

> ⚠️ **لا تستخدم `railway up` المجرد** — الربط في هذا المجلد يشير للمشروع القديم المعطّل (`881899a5`). استخدم دائمًا الأمر بالمعرّفات الصريحة الموثّق أدناه.

**Storefront deploy command (always from repo root):**
```bash
railway up --project b635b9d9-0241-4f5f-bbbd-1b6d2468d2c4 \
           --service  f7497b9a-c86b-4c81-ae08-bac368caa0ae \
           --environment 168a8f3a-cbcc-4765-83f2-d376d3893289
```
Running `railway up` from `apps/storefront` fails — it uploads only the subdirectory and breaks the monorepo start command `cd apps/storefront && next start -p 8000`.

> ⚠️ **تصحيح موثّق بدليل (2026-07-30): الستورفرنت يُنشر تلقائيًا عند الدفع إلى `main` أيضًا** — خلافًا لما كان مكتوبًا أعلاه من أنه «يدوي فقط». الدليل: آخر نشر ناجح للخدمة كان `de49d4a1` وبيانات مصدره `reason: "deploy"`، `branch: main`، `repo: Te214356/promptr`، و`commitHash: 783cead` — أي كوميت دُفع بلا أي `railway up` بعده. لا يزال `railway up` مفيدًا لنشر تغييرات غير مكوميتة أو لإجبار إعادة بناء (لتفريغ كاش قائمة المنتجات مثلًا)، لكنه **ليس شرطًا** لظهور ما دُفع إلى `main`. لم أفحص إعدادات الخدمة في لوحة Railway للتأكد من متى فُعِّل هذا الربط.

### ⚠️ النشر التلقائي قد يفشل بسبب npm 429 — تحقّق دائمًا من الإنتاج بعد الدفع

الدفع إلى `main` يُطلق البناء، **لكن نجاح الدفع ليس نجاح النشر**. حالة موثّقة (2026-08-02، كوميت `c98d925`): فشل البناء بخطأ من سجل npm لا من الكود:

```
npm error code E429
npm error 429 Too Many Requests - GET https://registry.npmjs.org/@medusajs%2fmodules-sdk
Build Failed: process "npm install" did not complete successfully: exit code: 1
```

**الحل:** إعادة النشر بنفس الكوميت بلا أي تعديل على الكود:

```bash
railway redeploy --from-source --yes \
  --project b635b9d9-0241-4f5f-bbbd-1b6d2468d2c4 \
  --service f7497b9a-c86b-4c81-ae08-bac368caa0ae \
  --environment 168a8f3a-cbcc-4765-83f2-d376d3893289
```

**قاعدة عمل:** بعد كل دفع، تحقّق من الإنتاج فعليًا (استطلاع الصفحة الحيّة بحثًا عن نصّ أو صنف يميّز التغيير) ولا تفترض أن النشر التلقائي نجح. ولمعرفة حالة البناء مباشرة:

```bash
railway deployment list --project … --service … --environment … --json   # الحالة + commitHash
railway logs --build <DEPLOYMENT_ID>                                      # سبب الفشل
```

> تنبيه على شكل الأمر: `railway logs --build <ID>` — لا يقبل `--deployment` مع `--build` معًا.

There is also an old crashed service named `promptr` in a separate project (`881899a5`) — ignore it, it is not the live backend.

---

## Digital Product Delivery Pipeline

**Status (2026-07-25):** 🎯 12-product catalog target reached and shipped — all 12 products published in Medusa (verified directly against the live store API: both `ai-basics-arabic` and `ecommerce-success-guide` return `status: "published"` with correct `metadata.file_key`). Golden-path test (full order → confirmation email → correct download link) passed for `ecommerce-success-guide` (12th), per team report — not independently re-verified here.

**Remaining external blocker:** Moyasar live-payment account activation is pending required documentation (support ticket `94773`) — blocked until funds are available to complete it, expected at next payday. Until then the storefront can only take live payments once Moyasar approves the account; this is unrelated to the product catalog itself, which is fully built either way.

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
| `ai-video-guide-arabic` | `ai-video-guide-arabic.pdf` |
| `customer-service-prompts` | `customer-service-prompts.pdf` |
| `ai-basics-arabic` (11th) | `ai-basics-arabic.pdf` |
| `ecommerce-success-guide` (12th) | `ecommerce-success-guide.pdf` |

`ai-basics-arabic`'s cover image is uploaded to the public bucket (`promptr-uploads`) as `ai-basics-arabic-cover.png` — public URL: `https://pub-896449c4f58a451cbf268d643d1dff28.r2.dev/ai-basics-arabic-cover.png`.

`ecommerce-success-guide`'s cover image is uploaded to the public bucket (`promptr-uploads`) as `ecommerce-success-guide-cover.png` — public URL: `https://pub-896449c4f58a451cbf268d643d1dff28.r2.dev/ecommerce-success-guide-cover.png`.

### Signed URL generation
`apps/backend/src/utils/signed-url.ts` — generates **48-hour** presigned GET URLs with `ResponseContentDisposition: attachment` (كانت 7 أيام؛ قُصِّرت 2026-08-08 لأن الرابط الموقّع حامله يملكه). Uses env vars: `S3_PRIVATE_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_ENDPOINT`, `S3_REGION`.

### Download API
`GET /store/order-downloads?order_id=xxx&email=customer@example.com`
- Requires `x-publishable-api-key` header
- Ownership check: logged-in customer → matches `auth_context.actor_id` vs `order.customer_id`; guest → matches `email` param vs `order.email` (case-insensitive)
- Always returns `403 { message: "unauthorized" }` on failure — never 404 (avoids leaking order existence)
- Returns `{ downloads: [{ product_title, download_url }] }`
- **Rate limited: 15 requests per `order_id` per 10 minutes**, then `429` with `Retry-After`. Rejected (403) attempts count too. Keyed on `order_id` — **not IP** — because the confirmation page calls this route server-side, so all legitimate buyers share the storefront's address. Counter is in-process; move to Redis if the backend ever runs more than one instance.

### Order confirmation email
`apps/backend/src/subscribers/order-placed.ts` — on `order.placed`:
1. Generates signed URLs for all items with `file_key` in product metadata
2. Sends Arabic RTL email via Resend from `orders@promptrsa.com`
3. Email failure is caught and logged — never breaks order processing
Env vars required: `RESEND_API_KEY`, `RESEND_FROM_EMAIL=orders@promptrsa.com`

### Storefront confirmation page
`apps/storefront/src/modules/order/templates/order-completed-template.tsx` — calls `getOrderDownloads(order.id, order.email)` server-side and renders `<DownloadLinks>` component above order summary. Silent on empty/error.

---

## canonical — الحالة والخطة (2026-08-11)

تصدير Search Console أظهر **8 مسارات مفهرسة بنسختين** (`/X` و`/sa/X`). السبب في جملة: **كل صفحة متاحة بعنوانين ولا `canonical` يحسم أيهما الأصل**، فحسمت Google بالتناوب.

**القرار: `/sa/...` هي النسخة الأصل** — لأنها ما يُرجع 200 بلا تحويل، وما في `sitemap.xml`، وما ينشره `offers.url` في JSON-LD.

| الصفحة | الحالة اليوم |
|---|---|
| مقال مدونة | ✅ `/sa/blog/<slug>` |
| صفحة تصنيف | ✅ أُصلحت (كانت قيمة نسبية `ai-tools` تُحلّ إلى 404) |
| **صفحة منتج** | ❌ **بلا canonical** — وهي محور الازدواج |
| **قائمة المدونة** | ⚠️ تشير إلى `/blog` المجرّد، عكس المقالات والخريطة |
| **الرئيسية** | ❌ بلا canonical — والوحيدة المقدَّمة بعنوانين حقيقيين (rewrite للجذر) |

**المتبقي:** إضافة canonical مطلق لصفحات المنتجات والرئيسية، وقلب قائمة المدونة إلى `/sa/blog`. بلا مساس بـ`middleware.ts`: تحويلات 307 وrewrite الجذر تبقى (شرط تحقق Google).

**مسار `/collections/*`** يبقى 404 بقرار — فهرسة قديمة لا صفحات عاملة، وGoogle تُسقطها.

---

## Product structured data (JSON-LD) — قرارات مقيسة (2026-08-09)

`modules/products/components/product-jsonld` — مكوّن **خادم** مُركَّب في `app/[countryCode]/(main)/products/[handle]/page.tsx`، فالمخرَج يظهر في HTML الأولي لا بعد hydration. قبل هذا لم تكن صفحات المنتجات تحمل أي بيانات منظّمة (المدونة وحدها كانت تحملها). تحقق بعد النشر على **الـ12 كلها**: JSON صالح، كل الحقول الإلزامية، وصفر حقل ناقص.

**1. وحدة السعر — قياس لا افتراض.** Medusa v2 يُرجع **الوحدة الصغرى**: `calculated_amount = 4900` من Store API، والصفحة نفسها تعرض `SAR 49.00` (`data-value="4900"`). فـ`toMajorUnit` (قسمة على 100) **مطلوبة**؛ حذفها يعلن سعر 4900 ريالًا لمنتج بـ49. أعد القياس بنفس الطريقة قبل أي تغيير هنا — لا تعتمد على هذه الفقرة وحدها.

**2. `returnPolicyCategory: MerchantReturnNotPermitted` — مطابقة للسياسة المنشورة.** نص `/refund-policy` صريح: «بمجرد تسليم المنتج الرقمي أو الإفصاح عن محتواه، **لا يمكن إرجاعه أو استرداد قيمته**». وحالات الاسترداد الأربع فيه (ملف تالف · عدم مطابقة جوهرية للوصف · ازدواج دفع · عدم تسليم خلال 24 ساعة) كلها **علاج عيب لا إرجاع اختياري**. ولأن schema.org لا يملك تصنيفًا لـ«استرداد عند العيب فقط»، فالأضيق أصدق: `MerchantReturnFiniteReturnWindow` كانت ستَعِد بنافذة إرجاع لا نلتزم بها وقد يُستشهد بها ضدنا. لذلك حُذف `merchantReturnDays` و`returnFees`، وبقي `merchantReturnLink` ليصل القارئ إلى الاستثناءات.
> ⚠️ **إن تغيّر نص سياسة الاسترجاع، غيّر هذا التصنيف معه.** التناقض بين الـschema والصفحة أسوأ من غياب الـschema.

**3. `sku` مؤجَّل بنمط لا بقيمة مخترعة.** لا متغيّر في الكتالوج يحمل SKU (0/12)، فالقيمة `variants[0]?.sku ?? product.handle` — الـhandle معرّف ثابت وفريد وقابل للتحقق. **عند تعبئة SKU حقيقي في Admin يُلتقط تلقائيًا بلا تعديل كود.**

**4. تعدد المتغيرات.** اليوم كل منتج بمتغيّر واحد وسعر واحد (فُحص: `>1 variant or >1 price: NONE`). المكوّن يقرأ **كل** الأسعار: سعر واحد ⟵ `Offer`، وأكثر ⟵ `AggregateOffer` بـ`lowPrice`/`highPrice` — حتى لا يُنشر سعر متغيّر واحد كأنه سعر المنتج يوم يُضاف متغيّر ثانٍ.

**5. ما لا يُضاف أبدًا:** `aggregateRating` أو `review` — لا تقييمات حقيقية، وتلفيقها مخالفة صريحة لسياسات Google تعرّض الموقع لعقوبة. و`inLanguage` ليست من خصائص `Product`.

**6. `generateMetadata`** كان يكرر العنوان وصفًا. صار يستخدم `product.description` عبر `lib/util/plain-text` (تنظيف Markdown والأسطر) مقتطعًا عند 155 حرفًا على حدّ كلمة، مع `|| product.title` كبديل — **الميتا لا يجوز أن تكون فارغة، بخلاف الـJSON-LD** الذي يحذف `description` كليًا لو خرج فارغًا.

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
| **رابط موقّع** | 48-hour presigned R2 URL for PDF download |
| **مفتاح الأسلوب** | Style-variable feature in `chatgpt-arabic-prompts`: `[الأسلوب: فصحى رسمية / فصحى مُيسَّرة / خليجية]` |
| **railway up** | Manual storefront deploy — always from repo root with explicit IDs |
| **صفحة التأكيد** | `/[countryCode]/order/[id]/confirmed` — shows download links post-payment |

---

## Security — Admin Credential Incident (resolved 2026-07-27)

**ما حدث:** مراجعة أمنية شاملة (git history secrets scan) اكتشفت أن `scripts/reupload-product-images.py` كان يحتوي على بيانات دخول أدمن حقيقية بنص صريح لحساب `admin@promptr.com` على الباكند الحي (`api.promptrsa.com`) — أخطر ثغرة وُجدت في تلك المراجعة.

**المعالجة** (كما أبلغ الفريق — لم تُتحقق برمجيًا من جانب Claude في هذه الجلسة):
- أُنشئ حساب أدمن جديد بإيميل حقيقي `team.promptr@gmail.com` عبر **Railway Console** (تبويب Console في لوحة الخدمة)
- حُذف `admin@promptr.com` القديم نهائيًا (كان إيميلًا وهميًا بكلمة مرور مكشوفة)
- أُزيل `scripts/reupload-product-images.py` من شجرة الريبو — commit `c3f4f00` (تحقّق مباشر: Claude نفّذ هذا الكوميت)

**ملاحظة تقنية لأي محاولة مستقبلية مشابهة:** لا تستخدم `railway ssh` + `npx medusa user` كأول خيار لإدارة مستخدمي الأدمن على الباكند الحي. واجهنا فشلين متتاليين بهذا المسار: (1) مفتاح SSH/ثقة المضيف غير مُعدَّين افتراضيًا محليًا، (2) بعد حلّها، فشل CLI بخطأ "must be run inside a Medusa project" لأن جلسة SSH تهبط في جذر المونوريبو `/app` لا `apps/backend` (يحتاج `cd apps/backend &&` قبل أي أمر `medusa`) — ولم نتحقق أبدًا من نجاح المحاولة بعد هذا التصحيح. **المسار الذي نجح فعليًا: تبويب Console في لوحة خدمة Railway مباشرة.** ابدأ به أولًا في المرة القادمة.

### قبل تفعيل Moyasar الحي — قائمة تحقق إلزامية

لا يجوز تفعيل حساب Moyasar للدفع الحي قبل إتمام كل ما يلي:
1. **تنظيف git history من كلمة المرور القديمة** — لا تزال قابلة للاسترجاع الكامل من commit `754c9a1` رغم حذف الملف من HEAD (`git rm --cached` لا يمس التاريخ)
2. ~~**إضافة `**/.env.production` إلى `.gitignore`**~~ — ✅ **مغلق (2026-08-07، كوميت `be027d9`)**. أُضيفت القاعدة `**/.env.production` في `.gitignore` الجذري (كانت التغطية تشمل `*.local` وحدها)، وأُزيل الملفان المتتبَّعان من الفهرس بـ`git rm --cached` **مع بقائهما على القرص** فلم يتأثر البناء المحلي. لم يبقَ متتبَّعًا سوى `.env.template` في المشروعين.
   **نتيجة التدقيق قبل الإزالة — لا تدوير مطلوب:** فُحصت **كل** نسخة تاريخية من الملفين (ثلاثة كوميتات: `4876b0f`, `987f2ab`, `84536b2`) فلم تحمل إلا متغيرات عامة: عناوين الباكند والموقع، `NEXT_PUBLIC_DEFAULT_REGION`، `MEDUSA_DISABLE_ADMIN`، و`NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` (مفتاح قابل للنشر بتصميمه ويُرسل للمتصفح). ومسح كامل التاريخ لأي `*.env.production` بحثًا عن `SECRET|PASSWORD|PRIVATE|TOKEN|sk_|DATABASE_URL|REDIS_URL|RESEND|S3_` أرجع **صفر نتائج**. أي أن الفجوة كانت **خطرًا كامنًا لا تسريبًا واقعًا**: أول سرّ يُكتب في ملف متتبَّع بهذا الاسم كان سيصير دائمًا في التاريخ بعد أول دفع.
3. **تحقق يدوي من إعدادات Cloudflare R2**: تأكيد أن `Public Development URL` مُعطَّل (Disabled) لـ bucket `promptr-files` — لم يمكن التحقق من هذا برمجيًا (لا يوجد Cloudflare API token متاح في بيئة العمل، فقط مفاتيح S3-compatible)
4. **إصلاح تحقق توقيع Moyasar webhook (HMAC)** — لا يوجد أي تحقق توقيع حاليًا في `apps/backend/src/modules/moyasar/service.ts`. يعمل حاليًا "آمنًا بالصدفة" فقط بسبب علة برمجية منفصلة (`getWebhookActionAndData` يقرأ `payload.id`/`payload.status` بدل الشكل الفعلي `payload.data.id`/`payload.data.status`)، فيتجاهل كل الطلبات الحقيقية والمزوّرة على حد سواء. إصلاح هذه العلة وحدها بدون إضافة تحقق توقيع حقيقي في نفس الوقت سيفتح مسار ثقة بـwebhook غير موثّق — يجب إصلاح الاثنين معًا. (تدفق الدفع الفعلي نفسه سليم ومنفصل عن هذا: الباكند يتحقق من Moyasar server-to-server مباشرة بمفتاحه السري قبل قبول أي دفع، بغض النظر عن الـwebhook.)
5. **مراجعة أمنية من مختص بشري** قبل تفعيل الدفع الحي

6. ~~**مقارنة المبلغ والعملة في `authorizePayment`**~~ — ✅ **مغلق (2026-08-08، كوميت `555c395`)**. كانت **ثغرة قابلة للاستغلال فعليًا**: نموذج Moyasar يُهيّأ في المتصفح بـ`cart.total` (`modules/checkout/components/payment/index.tsx` ← `moyasar-form`)، فالمبلغ تحت سيطرة المشتري، والباك إند كان يتحقق من **الحالة فقط** (`paid`/`captured`) ولا يقارن المبلغ إطلاقًا. دفع ريال واحد لسلة كاملة كان يُصرَّح، ويكتمل الطلب، وتُرسل روابط التحميل فورًا لأن المنتجات رقمية.
   **الإصلاح:** `authorizePayment` يقارن `payment.amount` و`payment.currency` بمبلغ الجلسة وعملتها قبل القبول، ويُرجع `STATUS.ERROR` مع سطر خطأ صريح ووسم `amount_mismatch` عند أي فرق.
   **لماذا احتاج تعديل `initiatePayment` أيضًا:** `AuthorizePaymentInput` = `{ data?, context? }` فقط — **المبلغ لا يصل إليها**. فتُثبَّت `expected_amount`/`expected_currency` في بيانات الجلسة عند الإنشاء (المسارين معًا).
   **وحدة المبلغ — الطرفان بالهللات، بثلاثة أدلة مستقلة لا بافتراض:** (1) Store API الحي يُرجع `calculated_amount: 9900` لمنتج بـ99 ريالًا، (2) HTML صفحة المنتج يعرض `data-value="9900"` ⟵ `SAR 99.00`، (3) `refundPayment` (سطر 328) يرسل مبلغ Medusa إلى Moyasar عبر `toMoyasarAmount` = `Math.round` **بلا ×100**. والمقارنة تستخدم **نفس دالة التحويل** فلا ينزاح المقياس بين الجهتين.
   > ✏️ **تصحيح (2026-08-28):** كان الدليل الثالث مكتوبًا هنا باسم `updatePayment` — وهو **خطأ**: `updatePayment` (سطر 363–365) لا ينادي Moyasar إطلاقًا، بل يُرجع `input.data` وحده، فلا يصلح دليلًا على المقياس. استُبدل بـ`refundPayment:328` وهو المكان الوحيد في الباك إند الذي يرسل مبلغًا فعلًا. صُحّح معه التعليق داخل `authorizePayment` الذي كان يكرر الادعاء نفسه.

   > ### ⛔ لا تضرب المبلغ في 100 في أي مكان في مسار الدفع
   >
   > المبلغ المحصَّل يُقرَّر في **سطر واحد**: `moyasar-form/index.tsx:38` ⟵ `amount: Math.round(cart.total)` تمريرًا خامًا. والستورفرنت **يقسم على 100 عند العرض** (`lib/util/money.ts`)، فـ**المبلغ المحصَّل يساوي المعروض على الشاشة دائمًا**. لا يوجد — ولا يجوز أن يوجد — أي `* 100` في هذا المسار:
   >
   > | التعديل | الأثر الفوري |
   > |---|---|
   > | ضرب في النموذج وحده | `expected_amount` يبقى 1× ⟵ حارس المبلغ **يرفض كل عملية دفع** في المتجر |
   > | ضرب في الطرفين معًا | تحصيل **100 ضعف** السعر المعروض من كل مشترٍ (49 ريالًا ⟵ 4,900) |
   >
   > **وفرق 100× يظهر في لوحة Admin ليس عطلًا في هذا المسار** — بل علّة العرض الموثّقة في قسم *Admin Price Entry Rule*: طلب حقيقي بـ1.00 ريال يظهر هناك «100.00». قبل أي تعديل، قِس السعر من Store API الحي وقارنه بما تعرضه صفحة المنتج — لا تبدأ من رقم Admin.
   **قرار fail-closed:** جلسة بلا `expected_*` **تُرفض** لا تُقبل. أثره محصور في مشترٍ كان وسط الدفع لحظة النشر (يعيد المحاولة)؛ والبديل كان سيترك الثغرة مفتوحة بصمت لكل جلسة قديمة.
   **الاختبار:** على الخدمة المُصرَّفة مع تعطيل نداء الشبكة — مبلغ مطابق ⟵ `authorized`؛ 1.00 ريال مقابل سلة 99 ريالًا ⟵ `error`؛ 9900 **USD** مقابل 9900 **SAR** ⟵ `error` (قيمة فحص العملة: نفس الرقم كان سيمر لو قارنّا المبلغ وحده)؛ جلسة قديمة ⟵ `error`.

---

## المدونة (`/blog`) — منشورة منذ 2026-07-29

مدونة عربية مدمجة في الستورفرنت، مقالاتها ملفات Markdown داخل الريبو. **منشورة وحيّة على `promptrsa.com/blog`.**

### حالة المحتوى (2026-07-30)

**17 مقالًا منشورًا — تجاوزنا الحد الأدنى للهدف (15–20)** (انظر *الخطوة التالية* أدناه).

| المقال | الملف | المصدر | الشكل |
|---|---|---|---|
| كيف تكتب برومبت احترافي يعطيك نتيجة من أول محاولة | `how-to-write-effective-ai-prompts.md` | — | عناصر أربعة |
| سلة أم زد؟ كيف تختار منصة متجرك الإلكتروني في السعودية | `salla-vs-zid-comparison.md` | `ecommerce-success-guide` قسم 2 | شجرة قرار |
| الأنظمة السعودية التي يجب أن تعرفها قبل فتح متجرك | `saudi-ecommerce-regulations.md` | `ecommerce-success-guide` قسم 3 | خريطة جهات رسمية |
| كيف ترد على عميل غاضب | `how-to-handle-angry-customer.md` | `customer-service-prompts` قسم 2 | بنية سلوكية |
| أدوات الذكاء الاصطناعي: متى تستخدم كل واحدة | `ai-tools-when-to-use-each.md` | `ai-basics-arabic` قسم 2 | إطار اختيار |
| كيف تكتب وصف منتج يبيع | `product-description-that-sells.md` | `ecommerce-prompts-arabic` قسم 1 | مختبر إعادة كتابة |
| متى ترفض طلب عميل — وكيف | `how-to-say-no-to-customer.md` | `customer-service-prompts` قسم 5 | قاموس صياغات |
| من الإطلاق إلى أول عشرة طلبات | `first-ten-orders.md` | `ecommerce-success-guide` قسم 5 | خط زمني تنفيذي |
| سيرة ذاتية بلا خبرة عمل: إجابات لأسئلة الخريج الجديد | `cv-no-experience-questions.md` | `cv-guide-graduates` أقسام 1/3/5/6 | أسئلة وأجوبة |
| لماذا تخرج صورك بالذكاء الاصطناعي غير مقنعة | `why-your-ai-images-fail.md` | `midjourney-arabic-prompts` قسما 1 و6 | مصفوفة تشخيص |
| من 10 إلى 100 طلب: أربعة أرقام تدير بها متجرك | `from-10-to-100-orders.md` | `ecommerce-success-guide` قسم 6 | لوحة مؤشرات + قالب |
| رسالة واحدة، أربع منصات | `one-message-four-platforms.md` | `social-media-templates` أقسام 1–5 | شبكة تكييف |
| تشريح سكربت ريلز: ماذا يحدث في كل ثانية | `reels-script-anatomy.md` | `ai-video-guide-arabic` قسما 1 و4 | تشريح مُعلَّق |
| ست خرافات عن المحتوى التسويقي تكلّفك نتائج | `marketing-content-myths.md` | `marketing-prompts-arabic` أقسام 1–5 | خرافة ← أصلها ← الواقع |
| فكّر مع النموذج لا تكتب به — خمسة تمارين | `think-with-ai-exercises.md` | `chatgpt-arabic-prompts` قسم 7 | مسار تمارين متدرّجة |
| بنك برومبتاتك الشخصي: كيف تبنيه وتحافظ عليه | `build-your-prompt-bank.md` | `chatgpt-prompts-pro-arabic` قسم 5 | بروتوكول بناء نظام |
| من عرض السعر إلى الإغلاق: رحلة صفقة واحدة | `deal-journey-case-study.md` | `chatgpt-prompts-pro-arabic` قسما 2 و5 | دراسة حالة سردية |

**تنويع الشكل مقصود** ويجب أن يستمر — عمود «الشكل» أعلاه هو سجل ما استُهلك، فلا تكرّر شكلًا مستخدَمًا في مقال جديد. أدلة المنتجات الـ12 لا تزال تغطي بقية الهدف بلا بحث خارجي.

**الربط الداخلي:** كل مقال يحيل لمقال أو مقالين ذوي صلة (بمسار `/blog/<slug>`) إضافةً لمنتجه. عند إضافة مقال جديد، اربطه من مقال قائم أيضًا — لا تتركه معزولًا. تحقّق أن كل slug داخلي يطابق ملفًا موجودًا فعلًا في `content/blog/`، وأن كل مقال له **رابط وارد واحد على الأقل** (فُحص آليًا عند نشر المقال الحادي عشر: صفر مقال معزول، صفر slug مكسور، صفر رابط ذاتي).

**المنتجات المستخدمة كمصدر حتى الآن:** `ecommerce-success-guide` (أقسام 2/3/5/6)، `customer-service-prompts` (2/5)، `ai-basics-arabic` (2)، `ecommerce-prompts-arabic` (1)، `cv-guide-graduates`، `midjourney-arabic-prompts`، `social-media-templates`، `ai-video-guide-arabic`، `marketing-prompts-arabic`.

**كل المنتجات ذات `data.json` استُخدمت الآن** — آخرها `chatgpt-arabic-prompts` (قسم 7) و`chatgpt-prompts-pro-arabic` (قسما 2 و5). لا يزال في كل منتج أقسام لم تُستثمر بعد، فالمصدر لم ينفد: أي مقال قادم يبدأ من قسم غير مستخدَم في الجدول أعلاه.

> ⚠️ **`ai-income-book` و`digital-marketing-saudi-guide` ليسا مصدرًا صالحًا بهذه الطريقة:** لا يملك أيٌّ منهما ملف `data.json` (تحقّق مباشر 2026-08-03؛ الأول يُبنى من ملفات `book/` عبر `products/_book-template/generate.js`). لا تدرجهما في تخطيط مقال قادم قبل معالجة ذلك.

**`sitemap.xml` يشمل صفحات المنتجات (2026-08-11):** 37 رابطًا = 8 ثوابت + 17 مقالًا + **12 منتجًا** بصيغة `/sa/products/<handle>`. صفحات التصنيفات مؤجلة حتى إعادة تسميتها في Admin.
> **لماذا أُضيفت بعد أن كانت مستبعدة:** تصدير Search Console كشف **ثلاثة منتجات لم تُفهرس قط** (`ecommerce-prompts-arabic` · `social-media-templates` · `ai-income-book`) — لأن الاكتشاف كان يعتمد على الروابط الداخلية وحدها.
> **الحماية بأربع طبقات** في `app/sitemap.ts`: `fetch` مباشر لا `listProducts` (الأخير يقرأ الكوكيز فيُخرج المسار من التوليد المسبق) · مهلة 8 ثوانٍ · `revalidate = 3600` فتُشفى الخريطة ذاتيًا بدل تجميد لقطة بناء خاطئة · و`try/catch` يُرجع الثوابت والمقالات. **واستجابة سليمة بصفر منتجات تُعامَل كفشل** — المتجر لم يكن يومًا فارغًا، فالشكل يعني مشكلة مفتاح أو فلتر. كل مسار فشل يُسجَّل بـ`console.error`.

> ⚠️ **مصادر المنتجات ليست كلها آمنة للنقل الحرفي:** `midjourney-arabic-prompts` يحتوي أرقام إصدارات ومعاملات متضاربة داخليًا (يذكر `--v 8.1` ويصف `6.1` بأنه الأحدث في الفقرة نفسها). المقال التاسع تعمّد **عدم** ذكر أي رقم إصدار أو نطاق قيمة معامل، وأحال لتوثيق كل أداة. طبّق نفس الحذر مع أي رقم في بقية الأدلة.

> ملاحظة: روابط المحتوى الداخلية تُكتب بلا بادئة المنطقة (`/blog/…` و`/products/…`)، فيمرّ الزائر بتحويلة 307 إلى `/sa/…` وهو المسار الكنسي في `sitemap.ts`. مقبول حاليًا وشُغّل بنجاح، لكن إلغاء التحويلة (بجعل مُصيِّر روابط `marked` يضيف المنطقة الافتراضية) تحسين مؤجَّل للسيو.

المقال الثاني مستخرج من القسم 2 في `products/ecommerce-success-guide/data.json`. سقطت التعديلات الثلاث المعلّقة عليه بعد التحقق المباشر: شجرة القرار مكتملة بأسئلتها الأربعة، وجدول القنوات متسق بأربعة أعمدة في كل صف، ورابط `/products/ecommerce-success-guide` يعمل فعليًا (307 → 200 على صفحة المنتج الصحيحة، بينما handle وهمي يُرجع 404 — فالـ200 ليست صفحة عامة تبتلع أي مسار).

> 💡 **قاعدة تعلّمناها هنا:** طابق **نص الرابط** مع عنوان المنتج الفعلي في المتجر لا مع اسم تقريبي. كان النص «دليل نجاح المتجر الإلكتروني» والعنوان الحقيقي «دليل متجرك الإلكتروني» — اختلاف يكفي ليشكّ القارئ أنه وصل لصفحة خاطئة. تحقّق من العنوان بفتح صفحة المنتج قبل كتابة نص الرابط.

**المسار:** المقالات تحت `src/app/[countryCode]/(main)/blog` — أي أن الرابط الفعلي `promptrsa.com/sa/blog`، و`promptrsa.com/blog` يحوّل إليه بـ307 عبر الـmiddleware القائم. اختير هذا المسار لأنه يرث `Nav` و`Footer` تلقائيًا **بلا أي تعديل على `middleware.ts` أو `LocalizedClientLink`** — الأخير يقرأ `useParams().countryCode`، ولو وُضعت المدونة في مسار جذري لانكسرت كل روابط التنقل داخلها إلى `/undefined/...`.

**كتابة مقال جديد:** أنشئ `apps/storefront/content/blog/<slug>.md`. اسم الملف هو الـslug. الـfrontmatter:

```yaml
---
title: "العنوان"
description: "وصف مختصر — يظهر في البطاقة وفي meta description"
date: "2026-07-29"
tags: ["وسم", "وسم آخر"]
cover: "/images/blog/x.jpg"   # اختياري
author: "Promptr"              # اختياري
draft: false                   # true يخفيه من القائمة ومن sitemap
---
```

**مكوّنات المحتوى الغني** داخل المقال: صناديق تنبيه بصيغة GitHub (`> [!NOTE]` / `> [!TIP]` / `> [!WARNING]`)، جداول GFM (تُلفّ تلقائيًا بحاوية تمرير أفقي)، اقتباسات، كتل كود. الأنماط كلها في طبقة `.prose-promptr` داخل `src/styles/globals.css`.

**خط Cairo** محمّل عبر `next/font/google` في `blog/layout.tsx` **فقط** — بقية المتجر تبقى على خطها الأصلي. لا تنقله إلى الـroot layout دون مراجعة بصرية لكل صفحات البيع.

**بنية الكود:**
| المسار | الدور |
|---|---|
| `src/lib/blog/posts.ts` | قراءة الملفات (`server-only`) + كاش في الإنتاج + مقالات ذات صلة |
| `src/lib/blog/markdown.ts` | إعداد `marked`: معرّفات عناوين عربية مستقرة، صناديق التنبيه، الجداول |
| `src/lib/blog/format.ts` | تنسيق التاريخ — منفصل عمدًا لأنه آمن للاستيراد من مكوّنات العميل |
| `src/modules/blog/` | المكوّنات والقوالب |

> ⚠️ **علّة `marked` وثّقناها بعد أن أوقفت الصفحة كليًا:** تجاوزات الـrenderer **يجب** أن تُمرَّر ككائن عادي (`RendererObject`). صنف يرث `Renderer` **لا يعمل** — `marked` يقرأ الخصائص الذاتية (own enumerable) فقط، ودوال الصنف تقع على الـprototype فتُتجاهَل بصمت، بينما أي حقل نسخة (مثل `toc`) يرمي `renderer 'toc' does not exist`.

**SEO:** لكل مقال `title` و`description` و`canonical` وOpen Graph وJSON-LD بمخطط `Article`. أُضيف كذلك `src/app/sitemap.ts` و`src/app/robots.ts` **الأصليان من Next** — وهما يحلّان محل `next-sitemap.js` الموجود في الريبو لكنه **ملف إعداد ميّت**: الحزمة غير مثبّتة ولا سكربت `postbuild` يشغّلها، فلم يكن الموقع يقدّم `sitemap.xml` ولا `robots.txt` إطلاقًا قبل اليوم. (قرار حذف `next-sitemap.js` ما زال مؤجلًا.)

`og:image` يُصدَر **فقط** للمقالات التي لها `cover`؛ لا توجد صورة افتراضية بعد. لإضافتها: ضع صورة 1200×630 في `public/images` واربطها في `blog/[slug]/page.tsx`.

**نائب الغلاف أُزيل كليًا** (commit `b32bb10`): المقال بلا `cover` يعرض النص بعرض كامل بدل صندوق فارغ. أي إعادة إدخال لنائب بصري يجب أن تُقاس على هذا القرار.

**سلوك معروف ومقبول:** slug غير موجود يعرض للزائر صفحة «الصفحة غير موجودة» بشكل صحيح، لكن رمز الاستجابة **200 لا 404** — بخلاف مسار المنتجات الذي يُرجع 404 فعليًا. السبب حدود بثّ الاستجابة (streaming). القرار: مقبول حاليًا وعدم التضحية بهياكل التحميل من أجله. يستحق المراجعة لو ظهرت صفحات «soft 404» في Search Console.

**النشر:** المدونة جزء من الستورفرنت، فنشرها يدوي عبر `railway up` بالمعرّفات الصريحة (قسم *Railway Deployment* أعلاه) — وهو أيضًا ما يُفرغ كاش قائمة المنتجات المذكور في *ملاحظات مؤجلة*.

---

## ملاحظات مؤجلة

- ~~**بندان من فحص منطق العمل (2026-08-08)**~~ — ✅ **كلاهما مغلق (كوميت `11f2484`)**:
  - **مدة الرابط الموقّع**: `EXPIRY_SECONDS` في `utils/signed-url.ts` صار **`172800` (48 ساعة)** بدل 7 أيام. الرابط **حامله يملكه**، فالنافذة قُصِّرت؛ والمشتري لا يفقد شيئًا لأن صفحة التأكيد والمسار يولّدان رابطًا جديدًا كل زيارة — **وبريد الطلب صار يقول ذلك صراحة** ويدلّ على صفحة التأكيد بدل ترك المشتري أمام رابط منتهٍ.
  - **تحديد المعدل على `GET /store/order-downloads`**: **15 طلبًا لكل `order_id` كل 10 دقائق**، وبعدها **429** مع `Retry-After`. المحاولات المرفوضة (403) تُحسب أيضًا فلا يكون تخمين البريد مجانيًا.
    > ⚠️ **المفتاح `order_id` لا IP — عن قصد:** صفحة التأكيد تستدعي المسار **من الخادم** (`"use server"` في `lib/data/downloads.ts`)، فكل المشترين الشرعيين يصلون الباك إند من عنوان Railway واحد. حدّ على IP كان سيخنق المتجر كله أو لا يحمي شيئًا. و`order_id` هو شكل التهديد نفسه (رابط/معرّف مسرَّب).
    > العدّاد **في الذاكرة** لأن الباك إند خدمة واحدة، وتصفيره عند النشر لا يُضعف الحماية عمليًا. **انتقل إلى Redis** (المُعدّ أصلًا) يوم تتعدد نسخ الباك إند.
    **تحقق حي بعد النشر:** 15 طلبًا متتاليًا لنفس المعرّف ⟵ 403 (فحص الملكية)، والسادس عشر والسابع عشر ⟵ **429** مع `retry-after: 592`، ومعرّف آخر في نفس اللحظة ⟵ 403 (أي أن الحد على الطلب لا على المتصل).
  - **ما فُحص ووجد سليمًا في نفس الجولة** (لا تُعِد فحصه): قراءة طلبات الغير (`/store/orders/:id` بمعرّف عشوائي ⟵ 404، ولا مسارات مخصصة أخرى تقرأ طلبات)، والتسليم قبل الدفع (يُطلقه حدث `order.placed` وحده، ولا يُنشأ الطلب إلا بنجاح `authorizePayment`؛ والحالة المعلّقة تُرجع `PENDING` لا تصريحًا).

- **ترقيات أمنية مؤجلة لعدم وجود نسخة مستقرة (فحص 2026-08-07)** — `npm audit` يقترح إصلاحات تشير إلى نسخ **غير منشورة على القناة المستقرة**، فلا تُثبَّت:
  - **`@medusajs/framework`**: المقترح `2.16.0`، لكن `npm view` يُظهر `latest: 2.15.5` — وهو **المثبَّت لدينا** — و`2.16.0` موجود كـ`preview`/`snapshot` فقط. القرار: **لا نثبّت preview في باك إند حي**. راجع البند حين تصدر `2.16.0` مستقرة؛ ترقيتها تغلق أخطر ما في التقرير: **حقن SQL في `@mikro-orm/knex`** (المثبَّت `6.6.12` عبر `@medusajs/cli` → `@medusajs/deps`؛ المصلَحة `6.6.14` منشورة لكنها مثبّتة بدقة داخل شجرة Medusa). ورُفض حلّ `overrides` لرفع `@mikro-orm/knex` وحدها لأنه يفرض على Medusa نسخة لم تُختبر معها.
  - **`next`**: المقترح `15.5.22` وهو **غير موجود**؛ المتاح في الخط `15.5.19` (ولدينا `15.3.9`)، و`latest` هو `16.2.9` (ترقية كبرى). لا تُرقَّ قبل **التحقق من النسخة التي تغلق فعلًا** ثغرات Image Optimization و`sharp` و`postcss` — قد تتطلب 16.x.
  - الحالة وقت الفحص: **صفر ثغرة حرجة** في المشروعين؛ 29 عالية في الباك إند (أغلبها تبعيات Medusa غير مباشرة) و10 في الستورفرنت.

- **ازدواج عنوان الصفحة الرئيسية (`/` و`/sa`)** — نتيجة مقصودة لإعادة كتابة الجذر (انظر القسم أعلاه): العنوانان يقدّمان **نفس المحتوى بحالة 200**. مقبول اليوم لأن اجتياز تحقق Google كان الأولوية، لكنه ازدواج محتوى من منظور السيو. `sitemap.xml` يسمّي `/sa` فقط، فالإشارة الأقوى موجودة — والإصلاح المؤجل: إضافة `canonical` صريح على الصفحة الرئيسية يشير إلى إحدى الصيغتين وحدها. راجعه إن ظهر «صفحة مكررة» في تقرير التغطية بـSearch Console.

- **الصفحتان اليتيمتان حُسمتا (2026-08-06):** `/terms-of-use` و`/return-policy` حُذفت ملفاتهما، وصارتا **redirect دائمًا (308)** نحو `/terms` و`/refund-policy` عبر `redirects()` في `apps/storefront/next.config.js` — بالصيغتين المجرّدة والمسبوقة بالمنطقة معًا. اختير التحويل على الحذف حتى لا تنكسر روابط قديمة قد تكون مفهرسة. تحقّق حي: الأربعة مسارات تُرجع 308 وتنتهي بـ200 على السياسة الحالية.

- **`modules/home/components/featured-products/` صار يتيمًا (2026-07-31)**: كان يرسم شريط منتجات لكل Collection في الصفحة الرئيسية، وأُزيل استدعاؤه من `app/[countryCode]/(main)/page.tsx` مع عمود «المجموعات» في الفوتر. المجلد باقٍ بلا مستدعٍ بقرار صريح — حذفه قرار منفصل. مسار `/collections/[handle]` و`lib/data/collections.ts` باقيان كما هما، فلم يُحذف أي Collection من Medusa.
  **السبب:** `/store/collections` على الباكند الحي يُرجع `count: 0` (لا مجموعات أصلًا)، بينما كانت الواجهة تعرض شريط «قسم AI» بصورة مفقودة ورابط «عرض الكل» يعطي 404 لأن `getCollectionByHandle` ينفّذ `notFound()`. القسم كان مكررًا مفهوميًا لبطاقة «أدوات الذكاء الاصطناعي» ضمن التصنيفات الثلاثة الثابتة في `collection-cards/index.tsx` (وهي **Categories** لا Collections — بقيت كما هي).
  **علّة الكاش المرتبطة:** `lib/data/collections.ts` يستخدم `cache: "force-cache"` بلا `revalidate` (نفس علة كاش المنتجات أدناه). الصفحة الرئيسية كانت محميّة بـ`fetchCache = "force-no-store"`، أما الفوتر فيعيش في `layout.tsx` بلا هذا الإعداد — فكان يمكن أن يعرض قائمة مجموعات قديمة إلى أجل غير مسمى. أُزيل `fetchCache` من الصفحة الرئيسية لأن سببه الوحيد كان المجموعات.

- **كاش قائمة المنتجات في storefront دائم**: طلب `/store/products` في `apps/storefront/src/lib/data/products.ts` يستخدم `cache: "force-cache"` مع `next.tags` بدون أي `revalidate` زمني — بعكس طلب المناطق في `middleware.ts` الذي له `revalidate: 3600`. الـ tag نفسه مرتبط بكوكي `_medusa_cache_id` الخاص بكل زائر، لكن مفتاح الكاش الفعلي هو الـ URL المتطابق لكل الزوار المجهولين، فأي منتج جديد لن يظهر في `/store` حتى تُعاد تهيئة عملية Next.js. تحقّق فعلي بتاريخ 2026-07-17: منتج `social-media-templates` كان يُرجعه Store API بشكل صحيح (`count`, بيانات، سعر، sales channel — كلها سليمة) لكنه غاب عن HTML الصفحة الحيّة فعليًا حتى بعد تفريغ كوكيز المتصفح (private window)، لأن الكاش على مستوى الخادم وليس المتصفح.
  **الحل المؤقت الموثق**: إعادة نشر الواجهة (`railway up`، الأمر في قسم *Railway Deployment* أعلاه) بعد كل إضافة منتج جديد — يعيد تشغيل العملية ويُفرغ الكاش في الذاكرة.
  **الإصلاح الجذري المؤجل**: إضافة subscriber في الباك إند على أحداث `product.created` / `product.updated` يستدعي route جديد في الواجهة لتنفيذ `revalidateTag()` على تاغ المنتجات تلقائيًا، بدل انتظار نشر يدوي في كل مرة.

---

## مشاريع قادمة

1. **تفعيل قناة يوتيوب "سبعة أصفار"** — الهوية جاهزة (لوحة ألوان ذهبي/أسود، خط Cairo)، ووكيل youtuber مبني في `.claude/agents/youtuber.md` لإنتاج الأفكار والسكربتات والعناوين وبريفات الصور المصغرة بنفس الهوية.

2. ~~**إنشاء مدونة**~~ — ✅ **محسوم ومنفَّذ (2026-07-29)**. القرار المعماري حُسم لصالح **الدمج داخل `promptrsa.com`** لا مدونة منفصلة على Blogger: المحتوى على نفس النطاق يرفع سلطة الدومين ويقود الزائر مباشرة إلى صفحات المنتجات. التفاصيل في قسم *المدونة* أدناه.

3. **ربط Google AdSense** — ✅ **تدقيق ما قبل التقديم اكتمل (2026-08-06)**، ولم يبقَ سوى إنشاء الحساب:

   | البند | الحالة |
   |---|---|
   | عدد المقالات الأصلية | **17 مقالًا** — تجاوز الحد الأدنى (15) |
   | `/about` «من نحن» | منشورة، مرتبطة من الفوتر، ومدرجة في `sitemap.ts` |
   | `/contact` «اتصل بنا» | منشورة — واتساب + `orders@promptrsa.com` + وثيقة العمل الحر `FL-390003756` + نطاق الخدمة |
   | فقرة الإعلانات في سياسة الخصوصية | قسم واحد (ar+en): معلنو طرف ثالث، Google بالاسم، الكوكيز، ولا وصول لبيانات الحساب/الدفع، والتعطيل عبر `adssettings.google.com` |
   | ازدواج السياسات | محسوم — `/terms-of-use` و`/return-policy` صارتا **308 دائمًا** نحو `/terms` و`/refund-policy` |
   | `robots.txt` و `sitemap.xml` | يعملان، والخريطة تضم المقالات الـ17 وصفحتي about/contact |

   **حالة الكود (2026-08-06):** الحساب أُنشئ ومعرّف الناشر `ca-pub-1113985459345993`. في `app/layout.tsx` (الـroot) **وسمان معًا**، والمعرّف في ثابت واحد يغذّيهما:

   | الوسم | الوظيفة | موضعه |
   |---|---|---|
   | `<meta name="google-adsense-account">` | **إثبات الملكية** | `metadata.other` في `app/layout.tsx` |
   | `<script async crossorigin src="…adsbygoogle.js?client=…">` | **عرض الإعلانات لاحقًا** | JSX في نفس الملف |

   لا يتعارضان، ويجب بقاؤهما معًا: حذف الميتا يكسر التحقق، وحذف السكربت يمنع الإعلانات.

   ### مسار إثبات الملكية — ثلاث محاولات، رفضان

   | # | ما جُرّب | النتيجة |
   |---|---|---|
   | 1 | سكربت محصور في `/blog` عبر `next/script` | ❌ رفض — الزاحف يفحص **الصفحة الرئيسية** ولم يكن فيها |
   | 2 | سكربت على مستوى الموقع، ثم وسم `<script>` خام يظهر فعليًا في HTML الصادر من الخادم (مؤكَّد بـ`curl`) | ❌ رفض **رغم ظهوره** — أي أن وجود السكربت في HTML الخام **ليس** كافيًا لهذا الفحص |
   | 3 | `<meta name="google-adsense-account">` عبر `metadata.other` | ❌ رفض في حينه — **والسبب لم يكن الوسم** |
   | 4 | الوسم نفسه بعد إصلاح حلقة الكوكيز **وإعادة كتابة الجذر** | ✅ **الملكية مثبتة** (حسب ما أبلغ المستخدم 2026-08-06) |

   **الدرس الأهم:** الرفضات الثلاثة الأولى لم تكن بسبب الوسوم — الثلاثة (ميتا + سكربت + `ads.txt`) كانت مؤكَّدة حيًّا بـ`curl` طوال الوقت. السبب كان **أن الزاحف لا يصل للصفحة أصلًا**: حلقة كوكيز لا تنتهي، ثم جذر يُحوَّل بدل أن يُجيب. أضعنا ثلاث محاولات ونحن نبدّل الوسوم بينما العطل في طبقة الوصول.

   **الخلاصة العملية:** لأي تحقق ملكية مستقبلي — **تحقق أولًا أن الزاحف يستلم HTML فعلًا** (`curl` بلا كوكيز، بهوية الزاحف، على **العنوان المطلوب تحديدًا**)، ثم اهتم بالوسم. وابدأ بالعلامة الوصفية عبر `metadata.other` لا بالسكربت.

   **حالة AdSense (2026-08-06):** ✅ **الملكية مثبتة** بالعلامة الوصفية · ⏳ **مراجعة المحتوى مطلوبة** ولم تصدر نتيجتها بعد · 🚫 لا وحدة إعلانية منشورة. *(الحالة كما أبلغ المستخدم — لا يمكن التحقق منها برمجيًا من هنا.)*

   > ⚠️ **لماذا لم يبقَ السكربت محصورًا في `/blog`:** هذا كان سبب الرفض الأول. النطاق الآن كامل، وسقط معه استثناءا `/account` و`(checkout)` وحُذف المكوّن `modules/common/components/adsense-script` الذي كان يطبّقهما. إعادة الحصر ممكنة بعد القبول (استرجاع المكوّن من تاريخ git) — لكن **الميتا يجب أن تبقى على مستوى الموقع** في كل الأحوال.

   **`ads.txt` منشور** — `apps/storefront/public/ads.txt`، سطر واحد: `google.com, pub-1113985459345993, DIRECT, f08c47fec0942fa0`. تحقّق حي على `promptrsa.com/ads.txt`: **200، `text/plain; charset=UTF-8`، صفر تحويلات**. سبب أهمية «صفر تحويلات»: الـmiddleware يضيف بادئة المنطقة لكل مسار، وكان يمكن أن يحوّله إلى `/sa/ads.txt` فيراه زاحف Google 404 — لكنه يمرّر أي مسار يحوي نقطة (`pathname.includes(".")`) مباشرة، فيُقدَّم من الجذر كما تتطلب المواصفة. **أي ملف جذري مستقبلي بلا امتداد سيحتاج معالجة خاصة في الـmiddleware.**

   **Google Search Console (2026-08-06):** الموقع **موثّق** عبر ملف HTML: `apps/storefront/public/google46f0b93ef93c8597.html` بمحتوى سطر واحد. يُقدَّم من الجذر بـ200 وصفر تحويلات (مسار ذو نقطة ⇐ يتخطى الـmiddleware، نفس آلية `ads.txt`). **لا تحذف الملف** — حذفه يُلغي التوثيق. وحسب ما أبلغ المستخدم: `sitemap.xml` أُرسل، والصفحة الرئيسية فُهرست.

   > 🚫 **لا توجد أي وحدة إعلانية (ad unit) في أي مكان** — المضاف هو المكتبة فقط لأجل التحقق. حين تُضاف الوحدات فموضعها `blog/layout.tsx` وحده (التعليق هناك يوثّق ذلك)، ولا تدخل صفحات المتجر أو المنتج أو الدفع.

   > 🔎 **درس مقيس يبقى صالحًا رغم انتقالنا للميتا: `next/script` لا يضع وسمًا في HTML الصادر من الخادم.** القياس تم على **بناء إنتاج حقيقي** (`next build` + `next start`) بفحص HTML الخام بـ`curl` — لا على خادم التطوير، لأن سلوكهما يختلف:
   >
   > | الطريقة | ما يظهر في HTML الصادر من الخادم |
   > |---|---|
   > | `next/script` بـ`afterInteractive` | `<link rel="preload" as="script">` فقط — الوسم يُحقن بعد الترطيب |
   > | `next/script` بـ`beforeInteractive` | **نفس الشيء تمامًا** — `<link rel="preload">` فقط، خلافًا للمتوقع |
   > | `<script async crossorigin>` عادي في `app/layout.tsx` | ✅ وسم `<script>` فعلي داخل `<head>` في HTML الأولي |
   >
   > كان مكتوبًا هنا سابقًا أن `beforeInteractive` هو الحل — **وكان افتراضًا غير مقيس وخاطئًا**. الحل الوحيد الذي يراه الزاحف هو الوسم الخام، وهو حرفيًا ما تعطيه Google. React يرفعه إلى `<head>` تلقائيًا.

   > 📍 **النطاق الحالي:** الوسم في `app/layout.tsx` (الـroot)، فيُحمَّل على **كل** الصفحات بما فيها `/account` و`(checkout)` — استثناءان سقطا عمدًا لأجل اجتياز التحقق، وحُذف معهما المكوّن `modules/common/components/adsense-script`. لإعادة الحصر بعد القبول: استرجاع ذلك المكوّن من تاريخ git وتركيبه في `(main)/layout.tsx` — بشرط ألا يعود ذلك بالسكربت إلى صيغة لا يراها الزاحف.

   **بند اختياري متبقٍّ (لا يمنع التقديم):** صفحات المنتجات ما زالت خارج `sitemap.xml` بقرار موثّق في `sitemap.ts` (إدراجها يستدعي الباكند وقت البناء، وأي تعثّر منه يُفشل البناء) — يضعف السيو التجاري لا مراجعة AdSense.

---

## الخطوة التالية: بناء أرشيف المقالات

**الهدف:** 15–20 مقالًا أصليًا منشورًا — وهو ما يحتاجه تقديم AdSense (البند 3 أعلاه). المنشور اليوم: **17 مقالًا** (الجدول في قسم *المدونة*) — أي أن عتبة العدد لم تعد مانعًا للتقديم.

**مصدر المواضيع:** محتوى المنتجات الـ12 نفسها — كل دليل يعطي 3–4 مقالات مستقلة، فالكتالوج وحده يغطي الهدف بالكامل بلا بحث خارجي. (المقال الثاني مثال: مستخرج من القسم 2 في `products/ecommerce-success-guide/data.json`.)

**قاعدتان ثابتتان لكل مقال — لا استثناء:**
1. **قيمة كاملة بلا بتر** — المقال يقف بذاته ويعطي الإجابة كاملة. لا تُحجب خطوة أو معلومة لدفع القارئ نحو المنتج؛ الإحالة للمنتج تأتي في الخاتمة كتوسيع طبيعي لا كشرط لاكتمال الفائدة.
2. **لا أرقام متغيرة** — ممنوع ذكر أسعار أو رسوم أو عمولات أو حدود خطط. تتغيّر باستمرار وتُقادم المقال. اذكر الفرق الجوهري (الفلسفة، التكامل، لمن يناسب) وأحل القارئ للموقع الرسمي للأرقام المحدّثة.
