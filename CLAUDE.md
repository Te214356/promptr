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

## 🛑 حالة العمل الجارية — فرع `fix/moyasar-payment-errors` (2026-09-03)

### 🧭 استئناف الجلسة — آخر نقطة توقّف 2026-09-05

> توقّفت الجلسة عند حدّ السياق، **لا عند عطل ولا عند قرار**. ما يلي كافٍ لاستئناف العمل بلا إعادة قياس أي شيء وارد هنا.

**✅ ما تحقّق وقيس (لا تُعِد فحصه):**

| البند | الدليل |
|---|---|
| **22 تجربة خضراء** | 17 وحدة (`npm run test:unit`) + **5 على Postgres حقيقي** (`npm run test:integration:modules`) |
| **الفهرس المُهاجَر** | فُحص بـ`psql` على قاعدة مُهاجَرة فعلًا لا من النماذج: إعادة الإدخال ⟵ `duplicate key`، **وبعد الحذف الناعم ⟵ `duplicate key` كذلك** |
| **التزامن** | `Promise.all` بمطالبتين ⟵ **واحدة تفوز فقط**، والخاسرة تسمّي سلة الفائزة |
| **MPF يُرسل `metadata`** | مقيس من حزمة `moyasar.js v1.14.0` المثبّتة نفسها (السلسلة `Sr.B` ⟵ `gr()` ⟵ `Ur()` ⟵ `fetch`) |
| **البناء** | الباك إند والستورفرنت يُبنيان نظيفَين؛ أخطاء `tsc` في الستورفرنت **248 = خط الأساس بالضبط، صفر جديد** |

**⛔ ما كان محجوبًا — رُفع الحجب (2026-09-05):**

المفاتيح التجريبية الميتة كانت تحجب بندين. **أُبدلت بمفاتيح Test جديدة، وقيس عليها:**

| البند | الحالة اليوم |
|---|---|
| **المفاتيح التجريبية** | ✅ **حيّة** — `200` على نداء ميسر (كان `401` بالمفاتيح القديمة) |
| **ميسر يخزّن `metadata.cart_id` ويُعيدها** | ✅ **مقيس** من قراءة الدفعة عبر الخادم — لا من التوثيق. وهذه هي الفرضية الحاملة لحارس الربط كله، فقد صارت الآن مقيسة لا موصوفة |
| **الشرط [أ] — شراء كامل من طرف إلى طرف** | ⏳ **الباقي الوحيد.** لم يعد محجوبًا بالمفاتيح؛ يُنفَّذ يدويًا في المتصفح |

**وعطلان في بيانات البيئة المحلية أُصلحا في الطريق:**

1. **`tax_region` كان `provider_id = NULL`** ⟵ أُصلح إلى `tp_system`. صف بلا مزوّد ضرائب يكسر حساب الإجمالي في السلة، فلا يصل المشتري إلى الدفع أصلًا.
2. **`seed-local.ts` صار يضبط `provider_id` صراحةً** عند إنشاء منطقة الضريبة — حتى لا يعود العطل عند إعادة البذر على قاعدة نظيفة.

> ⛔ **لا تُؤتمت المتصفح على البيئة المحلية.** قيس في هذه الجولة: **29 ثانية لإنشاء سلة واحدة** — أبطأ من أن يُحتمل في أي حلقة أتمتة. الشرط [أ] يُنفَّذ **بشراء يدوي** والوكيل يقرأ النتيجة من قاعدة البيانات وسجلّ الخادم.

### 🛒 الشرط [أ] — الأرضية مفحوصة، والمتبقي شراء يدوي واحد

**توقّفت الجلسة هنا بقرار: المستخدم يشتري بيده لاحقًا.** كل ما دون ذلك جاهز ومقيس (2026-09-05)، فلا تُعِد فحصه:

| ما فُحص | النتيجة |
|---|---|
| **الحارس حيّ على الخادم الجاري** | `POST /store/payment-collections/pcol_doesnotexist/payment-sessions` بمزوّد ميسر ⟵ **409** برسالة الرفض العربية. أي أن الباك إند يشغّل الكود من `src/` **لا من بناء `.medusa/server` القديم** (وهو أقدم من التعديلات بنحو نصف ساعة) — فالشراء سيمرّ فعلًا عبر الحارسين |
| مفتاح ميسر في الطرفين | ✅ متطابق (`NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY` في الستورفرنت = `MOYASAR_PUBLISHABLE_KEY` في الباك إند). **اختلافهما يُفشل النموذج بلا سبب ظاهر** |
| `tax_region` | `sa` ⟵ `tp_system` ✅ |
| `moyasar_payment_claim` | موجود و**صفر صفوف** — فأي صف يظهر بعد الشراء هو أثر تلك العملية وحدها |

> ⚠️ **الخادمان يحتاجان إعادة تشغيل في الجلسة القادمة** — كانا يعملان على `:9000` و`:8000` وقت التوقّف، ولن يبقيا. وبعد الإقلاع **أعد فحص «الحارس حيّ» أعلاه** (نداء الـ409): هو الفحص الوحيد الذي يُثبت أن الخادم الجديد يقرأ من `src/`.
>
> ولا تنسَ Postgres: `brew services start postgresql@16`.

**الرابط وبيانات البطاقة — محفوظة هنا حتى لا يُبحث عنها ثانيةً:**

```
http://localhost:8000/sa/products/local-test-guide      ⟵ «دليل اختبار محلي» · 49 ريالًا · رقمي (بلا خطوة شحن)
```

بطاقة الاختبار من [توثيق ميسر](https://docs.moyasar.com/guides/card-payments/test-cards):

| الحقل | القيمة |
|---|---|
| الرقم | `4111111111111111` — Visa · Approved |
| بديل عند تعثّر 3DS | `4111114005765430` — Approved · **3DS بلا احتكاك** |
| لفحص فرع الفشل لاحقًا | `4201321234411220` — مدى · Declined |
| الاسم | أي اسم **من كلمتين** (شرط ميسر) |
| الانتهاء | أي تاريخ مستقبلي · CVC: أي ثلاثة أرقام |

**المسار:** المنتج ⟵ السلة (`/sa/cart`) ⟵ إتمام الشراء ⟵ العنوان ⟵ **الدفع مباشرة** (لا خطوة شحن ولا زر «تأكيد الطلب» — نموذج ميسر نفسه هو الدفع) ⟵ العودة إلى `…/checkout/moyasar-callback`.

> 📧 **البريد يُرسَل فعلًا:** `RESEND_API_KEY` و`S3_*` مضبوطة محليًا، فبريد الطلب يخرج من `orders@promptrsa.com` **بروابط تحميل موقّعة حقيقية**. ليست بيئة صامتة — استخدم بريدًا تملكه.

**ما يُقرأ بعد الشراء (لا أتمتة، قراءة أثر فقط):**

1. **رابط الـcallback كاملًا** من شريط العنوان — فيه `id` الدفعة، وبه تُقرأ الدفعة من ميسر بالمفتاح السري للتأكد أن `metadata.cart_id` يطابق السلة الفعلية.
2. **أسطر `[payment-guard]` و`[moyasar]`** من طرفية الباك إند — **لا يستطيع الوكيل قراءة تلك النافذة**، فيلصقها المستخدم.
3. من Postgres مباشرة: صف `moyasar_payment_claim` · الطلب · `payment_session.data`.

**📦 حالة المستودع — لم يُدفع ولم يُدمج شيء:**

- **ستة كوميتات محلية** على `fix/moyasar-payment-errors`، ولا شيء منها على `main` ولا على `origin`.
- **وعمل الحارسين كله لم يُكوَّت بعد** — تعديلات غير مرحّلة في `moyasar/service.ts` · `moyasar-form/index.tsx` · `moyasar-callback/page.tsx` · `cart/templates/index.tsx` · `medusa-config.ts` · `railway.json`، وملفات جديدة: `api/middlewares.ts` · `modules/payment-guard/` · مجلّدا `__tests__` · `integration-tests/`.
- **`/code-review ultra` لم يُشغَّل بعد.** يُطلقه المستخدم من الطرفية؛ لا يستطيع Claude إطلاقه.
- **ترتيب ما تبقّى:** ~~المفاتيح~~ ✅ ⟵ **الشرط [أ] (شراء يدوي — القسم أعلاه)** ⟵ `/code-review ultra` ⟵ قرار الدمج ⟵ النشر **بالترتيب المذكور في قسم النشر (الستورفرنت أولًا)**.


**ستة كوميتات محلية، ولا شيء منها على `main` ولا على `origin`.** توقّف العمل عند قرار لم يُحسم، لا عند عطل.

| الكوميت | ما فيه |
|---|---|
| `8960a5e` | رسائل فشل الدفع بدل الزر الأحمر الصامت |
| `fa2e095` | إصلاح سطر `.gitignore` الملتصق + توثيق أن اعتماد الأدمن المسرّب **ميت** + نتيجة الفحص الشامل |
| `8cd517f` | **الإصلاح الأساسي:** صفحة الدفع لا تُرجع 404 عند غياب السلة · `retrieveCart` يفرّق 404 عن انقطاع الباك إند |
| `126f0d0` | فروع ما بعد الخصم + توقيع الاسترجاع (والتوقيع حُذف في الكوميت التالي) |
| `6dac231` | حذف آلية الاسترجاع · `MutationObserver` للزر الأحمر · `Object.hasOwn` للإشعارات |
| `15e5c10` | توثيق موضع الفرع وما لم يُحسم بعد |

**ما هو مقيس ومستقر ولا يعتمد على أي نقاش معلّق:** إصلاح 404 · `throwOnFailure` · فروع ما بعد الخصم في `moyasar-callback` (ثلاثة كانت تعرض «إعادة المحاولة» بعد الخصم) · ترتيب `payment-errors` · إشعارات السلة. التجارب الأربع في قسم *صفحة الدفع و`SameSite=Strict`* مرّت كلها.

### ✅ (1) — `cart_id` بلا تحقق ملكية: **قيست 2026-09-03، وأُغلقت في نفس اليوم**

`moyasar-callback` يقبل أي `cart_id` من الرابط ثم يُشغّل `initiatePaymentSession` و`completeCart` عليه. **سابق لهذا الفرع، ولم يُرقَّع.**

> ⛔ **تصحيح لِما كان مكتوبًا هنا:** كان مكتوبًا أن تحقق الباك إند من الدفعة «يحتوي» الثغرة. **لا يحتويها.** حارس المبلغ يمنع *دفع أقل من المستحق*، ولا يمنع **إنفاق دفعة واحدة صحيحة أكثر من مرة**.

**لا يوجد أي ربط بين معرّف الدفعة والسلة — خمسة قياسات:**

| # | القياس | الموضع |
|---|---|---|
| 1 | `Moyasar.init` يُرسل **صفر `metadata`** — فسجلّ الدفعة لدى ميسر لا يحمل أي إشارة للسلة | `moyasar-form/index.tsx:129–143` |
| 2 | `expected_amount` يُثبَّت من **السلة الهدف** لا من الدفعة (`input.amount`) | `moyasar/service.ts:158–161` |
| 3 | `authorizePayment` يقارن **المبلغ والعملة فقط** — لا معرّف سلة ولا مشترٍ ولا استهلاك سابق | `moyasar/service.ts:238–276` |
| 4 | Medusa **يتجاهل** `id` الذي يُرجعه المزوّد؛ لا مفتاح فريد لمعرّف دفعة ميسر في أي جدول، والـidempotency **لكل جلسة** لا لكل دفعة | `@medusajs/payment/…/payment-module.js:152–165` و`233–235` |
| 5 | `POST /store/carts/:id/complete` و`/store/payment-collections/:id/payment-sessions` **بلا `authenticate`** — من يملك مُعرّف السلة يُكملها | `medusa/…/carts/middlewares.js:137` · `payment-collections/middlewares.js:51` |

**الاستغلال المربح لا يحتاج تخمين أي مُعرّف — إعادة إنفاق دفعة المهاجم نفسه:** يدفع مرة واحدة، يلتقط `id` من رابط الـcallback الخاص به، ثم يبني سلة جديدة **بنفس الإجمالي** ويستدعي الـcallback بنفس الـ`id` ⟵ `paid` ⟵ المبلغ مطابق ⟵ طلب مكتمل ⟵ **بريد بروابط تحميل موقّعة**. بلا حدّ للتكرار.

**سعة الاستغلال مقيسة من الـStore API الحي (2026-09-03):** الأسعار تتجمّع — `6900` عليها **4 منتجات**، `4900` عليها **3**، `9900` عليها **2**، `5900` عليها **2**. فدفعة 69 ريالًا واحدة تفتح **أربعة** منتجات مختلفة، كل واحد بعدد لا نهائي من المرات.

**والصيغة الحرفية في السؤال** (`cart_id` لسلة الغير) تعمل أيضًا بنفس الشرط (تطابق الإجمالي)، لكنها تحتاج تسريب مُعرّف سلة الضحية، و**عائدها سلبي للمهاجم** (هو يدفع والضحية تستلم). الخطر الفعلي هو إعادة الإنفاق أعلاه.

### الإغلاق — حارسان مستقلان، ولا يُقبل نصفهما

**[1] الربط: لأي سلة دُفعت هذه الدفعة؟**

| الطبقة | ما تفعل | الملف |
|---|---|---|
| المتصفح | `metadata: { cart_id }` في `Moyasar.init` — يُسجَّل على الدفعة لدى ميسر **مرة واحدة قبل الدفع**، فلا يُعاد توجيهه بعدها | `moyasar-form/index.tsx` |
| الخادم | middleware يشتق مُعرّف السلة من **مجموعة الدفع في الرابط** ويكتبه فوق أي `cart_id` أرسله العميل | `apps/backend/src/api/middlewares.ts` |
| المزوّد | يقارن الاثنين في `initiatePayment` (فلا تُنشأ جلسة أصلًا) ثم **ثانيةً** في `authorizePayment` من الدفعة الحيّة | `moyasar/service.ts` |

> ⛔ **الاشتقاق من الخادم ليس تفصيلًا.** لو أُخذ طرفا المقارنة من جسم الطلب لَكفى المهاجم أن يرسل مُعرّف السلة الذي تسمّيه دفعته — فتتطابق المقارنة وتسقط الحماية كلها.
>
> ⛔ **وغياب الـmetadata رفض لا تطابق.** أي دفعة أُنشئت قبل هذا التغيير تُرفض — **إلى الأبد، لا مؤقتًا**. وثمنها ليس «إعادة محاولة» كما كُتب هنا أولًا: لو نُشر الباك إند قبل الستورفرنت، خصم ميسر المال ثم رُفضت الدفعة، **فالمشتري مخصوم منه بلا طلب**، و«إعادة المحاولة» خصم ثانٍ لا علاج. العلاج الوحيد استرداد يدوي.
>
> **ما يجعل هذا محتمَلًا اليوم لا مقبولًا:** الدفع الحي لدى ميسر **غير مفعَّل بعد**، فلا يوجد جمهور دفعات معلّقة يُعطب. وهذه حقيقة **لها تاريخ انتهاء** — يوم يُفعَّل الدفع الحي يصير ترتيب النشر أدناه هو الفاصل الوحيد بين نشرة متعجّلة ومشترين مخصومين بلا طلبات.
>
> 🔊 **ولا يستطيع الحارس أن يختفي بصمت:** لو توقّف الـmiddleware لأي سبب، وصلت كل دفعة بلا `cart_id` ⟵ **رفض فوري وصاخب لكل عمليات الدفع**، لا تمرير صامت.

**[2] الاستهلاك: دفعة واحدة تُنفَق مرة واحدة**

وحدة `payment-guard` — جدول `moyasar_payment_claim` بفهرس **`UNIQUE` على `moyasar_id`**، والمطالبة تقع على `POST /store/carts/:id/complete`.

- **Postgres لا ذاكرة ولا Redis:** يجب أن يصمد عبر كل نشر. عدّاد `order-downloads` في الذاكرة لأن ضياعه يفتح إزعاجًا؛ ضياع هذا يفتح ثقبًا ماليًا. وRedis هنا كاش قابل للإخلاء.
- **جدول لا استنتاج من `payment_session.data`:** السؤال «هل استُهلك؟» ثم الكتابة = **فحص ثم كتابة** بنافذة تسابق. الفهرس الفريد يجعلها **`INSERT` ذرّيًا**: طلبان متزامنان، Postgres يُدخل أحدهما ويُوقف الآخر حتى يلتزم الأول ثم يفشل. **لا توحّدها إلى SELECT ثم INSERT.**
- **الفهرس غير جزئي عمدًا:** مولّد Medusa يكتب `WHERE deleted_at IS NULL`، وهو **خطأ هنا** — حذف ناعم لسجل استهلاك يُعيد الدفعة للإنفاق. الإنفاق لا يُلغيه التنظيف. لو اقترح `db:generate` تضييق الفهرس مستقبلًا فذلك **ارتداد لا تنظيف**.
- **المطالبة عند `complete` لا عند إنشاء الجلسة:** لو طالبنا أولًا، لَكان مشترٍ شرعي بتبويبين وسلة قديمة في الكوكي **يحرق دفعته على السلة الخطأ** ثم يُمنع من الصحيحة. وعند `complete` يكون الربط قد فُحص أصلًا.
- **إعادة التقديم لنفس السلة مسموحة** (مشترٍ يعيد المحاولة بعد فشل)، **ولسلة أخرى مرفوضة**.

> 🧯 **إنقاذ يدوي — الحالة الوحيدة التي تحتاجه:** مشترٍ خُصم منه ثم فقد سلته (مسح الكوكيز، أو أُكملت السلة فاستُبدلت). دفعته مربوطة بالسلة القديمة، فلا الربط ولا سجل الاستهلاك يسمحان بإنفاقها على سلة جديدة — **وهذا صحيح ومقصود**. العلاج ليس حذف صف المطالبة (الربط سيرفض على أي حال) بل **إنشاء الطلب يدويًا أو الاسترداد**. لا تُرخِ أي حارس لعلاج حالة فردية.
>
> ⚠️ **وخطأ وقع فعلًا في هذه الجولة، يستحق البقاء:** `isUniqueViolation` كُتب أولًا يفحص `code === "23505"` ونصّ «duplicate key» — و**لا شيء منهما يصل**. Medusa يلفّ كل وعد مستودع بـ`dbErrorMapper` الذي يحوّل الخرق إلى `MedusaError(INVALID_DATA, "… already exists.")` **بلا `code`**. فكان كل مشترٍ يعيد المحاولة على سلته يُرفض للأبد، **والتجارب خضراء** لأنها اختلقت شكل خطأ pg خامًا لا يحدث في الإنتاج. الدرس: **عند التقاط خطأ من طبقة بيانات، اقرأ ما تُخرجه الطبقة فعلًا لا ما يُخرجه المحرّك تحتها.**

**رسالة الرفض** عربية واحدة لا تكشف سببًا تقنيًا («تعذّر إكمال هذا الطلب…»): من يصلها إما مهاجم لا يستحق معرفة آلية الفحص، أو مشترٍ حقيقي لا تعني له «عدم تطابق ربط السلة» شيئًا. السبب الحقيقي في سجل الخادم بمعرّف الدفعة.

**التجارب الدائمة — 22، كلها خضراء (2026-09-04):**

| الملف | التشغيل | ما تُثبته |
|---|---|---|
| `moyasar/__tests__/cart-binding.unit.spec.ts` (8) | `npm run test:unit` | الربط: سلة ثانية ⟵ رفض · بلا metadata ⟵ رفض · حارس المبلغ لم ينكسر |
| `payment-guard/__tests__/claim.unit.spec.ts` (9) | `npm run test:unit` | تفريع نتائج المطالبة · شكل الخطأ الحقيقي · وجود الدوال المولَّدة فعلًا |
| `payment-guard/__tests__/claim-race.integration.spec.ts` (5) | `npm run test:integration:modules` | **على Postgres حقيقي:** إعادة الاستعمال ⟵ رفض · إعادة التقديم لنفس السلة ⟵ قبول · **مطالبتان متزامنتان بـ`Promise.all` ⟵ واحدة تفوز فقط** |

> ⚠️ **المشغّل التكاملي يبني المخطط من النماذج لا من ملف الهجرة**، فلا يختبر ما يُنشر فعلًا. فُحص ملف الهجرة **مباشرة** على قاعدة مُهاجَرة بـ`psql`:
> ```
> insert مرتين بنفس moyasar_id ⟵ duplicate key ... IDX_moyasar_payment_claim_moyasar_id_unique
> soft-delete ثم insert ثالث   ⟵ duplicate key كذلك   ⟵ الفهرس غير جزئي كما قُصد
> ```
> الحذف الناعم **لا يُعيد الدفعة للإنفاق** — وهذا هو الخروج المتعمَّد عن مولّد Medusa، وقد صار مقيسًا لا موصوفًا.

### 🧪 قاعدة على التجارب: **افحص من أين تأتي مدخلات التجربة**

ثلاث مرات في هذا العمل كانت التجارب خضراء وهي تختبر شرطًا **مصنوعًا لا يقع في الواقع**:

| # | التجربة | ما اختلقته | ما كان يخفيه |
|---|---|---|---|
| 1 | `SameSite` بـ`curl` | المُختبِر يقرّر ما يُرسل بـ`-b` | `curl` بلا محرّك SameSite أصلًا — أثبتت أن المسار **يعمل** لا أنه **مطلوب** |
| 2 | خرق الفهرس الفريد | خطأ pg خام بـ`code: "23505"` | Medusa يلفّه بـ`dbErrorMapper` ⟵ `MedusaError` بلا `code`؛ **كل مشترٍ يعيد المحاولة على سلته كان يُرفض للأبد** |
| 3 | ربط السلة (8 تجارب) | كائن دفعة ميسر مكتوب بيدي بـ`metadata.cart_id` | **لم يُقَس بعد** أن ميسر يُعيد الحقل، ولا أن نموذج MPF يُرسله أصلًا |

> **القاعدة:** التجربة التي تبني مدخلاتها بنفسها تُثبت أن **الكود يوافق افتراضي**، لا أن الافتراض صحيح. وكل عطل من الثلاثة أعلاه سكن في الافتراض لا في الكود.
>
> **الفحص العملي قبل الوثوق بأي تجربة خضراء:** من أين جاء هذا المدخل؟ إن كانت الإجابة «كتبته أنا استنادًا إلى قراءة الكود/التوثيق» فالتجربة تحرس ارتدادًا، **ولا تثبت صحة السلوك**. الإثبات يحتاج مصدرًا خارجيًا: استجابة حقيقية، خطأ حقيقي، متصفح حقيقي.
>
> **وما لا تغطيه التجارب الحالية إطلاقًا:** الفهرس الفريد نفسه — الذرّية والتزامن مؤكَّدان **بالنثر لا بتجربة** (لا Postgres على جهاز التطوير). أي تجربة تكاملية بـ`moduleIntegrationTestRunner` تحتاج قاعدة بيانات.

### ⚠️ النشر: خطوتان لا تُخطآن

**1. الهجرة تعمل الآن قبل الإقلاع.** `startCommand` في `apps/backend/railway.json` صار `medusa db:migrate && medusa start` — **لم يكن يشغّل أي هجرة إطلاقًا**. بدون هذا يُنشر الكود وجدول `moyasar_payment_claim` غير موجود، فتفشل المطالبة، **فيُرفض كل شراء**. القرار يخصّ كل نموذج مستقبلي لا هذا وحده.

> ⚖️ **و`&&` مقصودة رغم ثمنها:** فشل الهجرة يعني أن الباك إند **لا يُقلع أصلًا** — انقطاع صريح عند كل إعادة تشغيل لا عند النشر وحده، وهجرات Medusa الأساسية تُطبَّق بلا إشراف عند أي ترقية نسخة. البديل (`;`) يُقلع الخادم بجدول ناقص، **فيُرفض كل شراء بصمت** ويبدو الموقع سليمًا. عطل صاخب أفضل من متجر يرفض كل عملية دفع بهدوء. راجع هذا الوزن إن كثرت الهجرات.

**2. ترتيب النشر: الستورفرنت أولًا، ثم الباك إند.**

| الترتيب | الأثر |
|---|---|
| الستورفرنت أولًا | يبدأ إرسال `metadata.cart_id`؛ الباك إند القديم يتجاهلها ⟵ **بلا أثر** |
| الباك إند أولًا | يبدأ رفض كل دفعة بلا `cart_id`، والستورفرنت لم يُرسلها بعد ⟵ **توقف الشراء حتى ينتهي بناء الستورفرنت** |

> الخدمتان تُنشران تلقائيًا من نفس الدفعة إلى `main` بأزمنة بناء مختلفة، فالنافذة قائمة. الطريق الآمن: `railway up` للستورفرنت أولًا (الأمر في قسم *Railway Deployment*)، ثم الدفع إلى `main`.

### ما بقي غير مقيس — ولا يُعامَل كمقيس

| البند | الحالة |
|---|---|
| **نموذج MPF يُرسل `metadata`** | ✅ **مقيس من الحزمة** `moyasar.js v1.14.0` (النسخة المثبّتة حرفيًا): `Sr.B(r)` ينسخ الخيار (`e in o && (o[e]=r[i])`، و`metadata` معرَّف في الباني) ⟵ `gr()` يتحقق (كائن، ≥1 زوج، ≤50) ⟵ `Ur()`: `i && Object.keys(i).length>0 && (t.metadata=i)` ⟵ `fetch(post, JSON.stringify(...))`. ومسار البطاقة `Wr()` يمرّ بـ`Ur` نفسه. **أعد القياس عند ترقية نسخة MPF.** |
| **ميسر يخزّن `metadata` ويُعيدها** | ✅ **مقيس (2026-09-05)** — بمفاتيح Test الجديدة: أُنشئت دفعة تحمل `metadata.cart_id`، ثم قُرئت **من الخادم بالمفتاح السري** فعادت تحمل الحقل نفسه. الفرضية الحاملة لحارس الربط لم تعد مأخوذة من التوثيق. |
| **شراء كامل من طرف إلى طرف** | ⏳ **لم يُنفَّذ بعد** — ولم يعد محجوبًا بالمفاتيح. يُنفَّذ **يدويًا في المتصفح**، لا بأتمتة. |

> 🔑 **المفاتيح التجريبية أُبدلت وتعمل (2026-09-05).** المفاتيح القديمة في `apps/backend/.env` كانت ميتة (`401`)؛ الجديدة تُرجع `200`. **لا تُعِد فحص هذا.**
>
> 🩹 **وأُصلح في نفس الجولة عطل بيانات كان يحجب السلة قبل الدفع:** صف `tax_region` كان `provider_id = NULL` ⟵ صار `tp_system`، و`seed-local.ts` صار يضبط `provider_id` عند الإنشاء فلا يتكرر العطل على قاعدة نظيفة.
>
> 🐢 **والبيئة المحلية أبطأ من أن تُؤتمت:** **29 ثانية لإنشاء سلة واحدة** (مقيس). كل ما تبقّى يُنفَّذ بيد المستخدم في المتصفح، والوكيل يقرأ الأثر من Postgres وسجلّ الخادم.

### 🐘 قاعدة تطوير محلية (أُعدّت 2026-09-04)

`postgresql@16` عبر Homebrew، و`DATABASE_URL` في `.env` كان يشير إليها أصلًا (`postgres://abuwessam@localhost:5432/promptr`).

```bash
brew services start postgresql@16
createdb promptr && createuser -s postgres   # مرة واحدة
npx medusa db:migrate
```

> **لماذا دور `postgres` رغم أن الاتصال بـ`abuwessam`:** `@medusajs/test-utils` يبني رابطه بنفسه من `DB_USERNAME` **وافتراضه `postgres`** (`test-utils/dist/database.js:24`) ولا يقرأ `DATABASE_URL` إطلاقًا. أُنشئ الدور بدل حشر اسم مستخدم الجهاز في المستودع — وهو أيضًا الدور الافتراضي في صور CI.
>
> و`db:migrate` ينتهي بخطأ من مزوّد S3 لغياب مفاتيحه محليًا — **بعد نجاح الهجرات، لا أثناءها**. تجاهله محليًا.

### 📈 المتجر لم يعد بلا زوار (2026-09-03) — الثغرات لم تعد نظرية

Search Console يؤكد **5 نقرات من بحث Google في 28 يومًا** — أي أن صفحات المتجر تصل إلى بشر حقيقيين لا إلى زواحف وحدها. *(كما أبلغ المستخدم؛ لا يمكن التحقق منه برمجيًا من هنا.)*

**أثره على الأولويات:** كل بند أمني في هذا الملف كان يُوزن سابقًا على أساس «لا أحد يزور الموقع أصلًا». هذا الافتراض **سقط**. أي ثغرة موثّقة هنا تُعامَل من اليوم كخطر واقع لا كخطر نظري — وأولها معلّق (1) أعلاه، الذي لا يحتاج مهاجمًا متمكّنًا بل مشتريًا واحدًا فضوليًا يقرأ رابط الـcallback في شريط عنوانه.

### ⚠️ معلّق (2) — هل كانت آلية الاسترجاع مطلوبة أصلًا؟

حُذفت في `6dac231` لأن توقيعها **مثبَت أنه لا يغلق الثغرة** (يوقّع «الخادم أصدر هذا المعرّف» لا «لهذا المتصفح»؛ والمهاجم يقرأ رمزًا صحيحًا لسلته من HTML صفحته). **هذا الجزء مقيس.**

**وما ليس مقيسًا: هل كانت مطلوبة.** بُنيت على أن كوكي `Strict` يضيع عند العودة من 3DS، وحُذفت على أن النقرة same-site تُعيده — **والافتراضان كلاهما غير مختبَر**، ولا يمكن اختبارهما بـ`curl`.

> **الحذف يبقى صحيحًا في الحالتين:** لو ثبتت الحاجة، فأسوأ أثر هو أن العائد من 3DS يرى «انتهت جلسة السلة» بدل خطوة الدفع — **لا 404 ولا خصم مزدوج** — والردّ الصحيح حينها بناء نسخة تربط بالمتصفح (nonce في كوكي `Lax` + تجزئته داخل الحمولة الموقَّعة)، لا إعادة المحذوفة.

**الفحص الذي يحسمها — في متصفح، لا `curl`:** أضف منتجًا ⟵ ادفع ببطاقة تفشل (أو ألغِ على صفحة البنك) ⟵ اضغط **«إعادة المحاولة»**. ظهرت خطوة الدفع بالسلة سليمة ⟵ لا حاجة للآلية أبدًا. ظهرت «انتهت جلسة السلة» ⟵ الحاجة حقيقية، وتُبنى بالربط أعلاه.

### قراران ينتظران المالك

1. الإبقاء على الحذف أم التراجع عن `6dac231` ريثما يجري فحص المتصفح.
2. `/code-review ultra` قبل الدمج — **يُطلقه المستخدم** (`/code-review ultra` في الطرفية)؛ لا يستطيع Claude إطلاقه.

> **درسان من هذه الجولة، يستحقان البقاء:**
> 🔬 **`curl` لا ينفّذ SameSite.** أي فحص به يُثبت أن مسار الاسترجاع **يعمل**، ولا يُثبت أنه **مطلوب**. هذا ما أخفى الخطأ حتى المراجعة الثانية.
> ⚠️ **عند إصلاح مسار مكسور، افحص ما الذي كان الكسر يحجبه.** رابط «إعادة المحاولة» بعد الخصم كان مكسورًا بالـ404، فجاء إصلاح الـ404 **فجعله يعمل** — أي حوّل دعوة لخصم مزدوج من معطّلة إلى صالحة.

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
| الأمان | إغلاق **ثغرة مقارنة المبلغ** (كانت قابلة للاستغلال) · تشديد روابط التحميل (حد 15/10د) · HSTS |

**المتبقي — بترتيب سهولة الإنجاز:**

1. **البند 3** — تعطيل `Public Development URL` لـ`promptr-files` في لوحة Cloudflare. **يدوي، دقيقتان**، ولا يحتاج كودًا.
2. **البند 4** — تحقق توقيع webhook (HMAC). **ينتظر سرّ التوقيع من لوحة Moyasar**؛ الكود محمي حاليًا بتحذير صريح فوق `getWebhookActionAndData` — لا تصحّح قراءة الحمولة بمعزل عنه.
3. **`Content-Security-Policy`** — مؤجل بقرار. يُبدأ بـ`Report-Only` أولًا لأن الموقع يحمّل AdSense وصور R2 وخط Cairo، وسياسة خاطئة تكسر الإعلانات أو الدفع بصمت.

> البندان 3 و4 هما ما تبقّى من **قائمة ما قبل تفعيل Moyasar الحي** (مع البند 5: مراجعة بشرية). البنود 1 و2 و6 مغلقة.

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
`apps/backend/src/utils/signed-url.ts` — generates **7-day** presigned GET URLs with `ResponseContentDisposition: attachment` (`EXPIRY_SECONDS = 604800`، وهو **الحد الأقصى** الذي يقبله توقيع SigV4 فلا يُرفع أكثر؛ أُعيد إليه 2026-09-07 بعد تجربة 48 ساعة، لتقليل رسائل «الرابط انتهى»). Uses env vars: `S3_PRIVATE_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_ENDPOINT`, `S3_REGION`.

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

## ⛔ لا تُنشئ أي منتج بـ`shipping_profile_id` (2026-09-06)

**كل منتجات المتجر رقمية بلا استثناء** — ملفات PDF تُسلَّم بالبريد. ولا يجوز أن يحمل أي منتج ملف شحن.

**السبب — `requires_shipping` ليس علمًا تضبطه، بل مشتقًا:** `core-flows/dist/cart/utils/prepare-line-item-data.js:23-29`

```js
const requiresShipping = isDefined(item?.requires_shipping)
    ? item.requires_shipping
    : hasShippingProfile || someInventoryRequiresShipping
```

فإرفاق ملف شحن بمنتج رقمي يجعل سطر السلة `requires_shipping = true`، ثم يرفض `validate-shipping` إكمال السلة بـ400 («No shipping method selected but the cart contains items that require shipping») — **بعد أن يكون ميسر قد خصم المال**. لا رسالة، ولا فرق ظاهر في Admin، ولا شيء يكشفه قبل أول شراء.

**مقيس على شراء حقيقي (2026-09-06):** `seed-local.ts` كان يضبط `shipping_profile_id`، فخُصم 49 ريالًا (اختباري) ولم يُنشأ أي طلب. الحارسان عملا بشكل صحيح — الدفعة تُحقّقت، والربط صحيح، والمطالبة كُتبت — والرفض جاء من Medusa لا منّا.

**والإنتاج سليم اليوم، مقيسًا من قاعدة Railway:** **0 من 17** منتجًا يحمل ملف شحن، و**31 سطر طلب في 24 طلبًا حقيقيًا كلها `requires_shipping = f`**. (الصفّان الوحيدان بـ`t` هما `Medusa T-Shirt` التجريبي المحذوف.) فالخطر **وقائي لا واقع** — لكنه ينفجر صامتًا عند أول منتج يُنشأ بملف شحن.

> **القاعدة:** عند إنشاء أي منتج — من Admin أو من سكربت — **لا تضبط `shipping_profile_id`**. وبعد إضافة أي منتج، تحقّق:
> ```sql
> select p.handle from product p join product_shipping_profile psp on psp.product_id = p.id;
> ```
> **يجب أن يعود فارغًا.** أي صف = منتج سيقبض ثم يرفض.
>
> ⏳ **حارس برمجي مؤجَّل:** الصواب لاحقًا تمرير `requires_shipping: false` صراحةً عند إضافة السطر للسلة، فلا يعتمد الأمر على نظافة البيانات. مؤجَّل بقرار.

**وأُصلح معه `isDigitalOnly`** في `checkout-form/index.tsx`: كان يستنتج الرقمية من **غياب خيارات الشحن**، وMedusa يقرؤها من **علم السطر** — سؤالان مختلفان. صار الآن `!cart.items?.some((i) => i.requires_shipping)`، أي **نفس الحقل** الذي يتحقق منه `validate-shipping`، فلا يمكن للطرفين أن يختلفا بنيويًا. ولو احتاج صنف شحنًا يومًا، تُرسم خطوة الشحن — فيتعثّر المشتري **قبل الدفع لا بعده**.

> ⛔ **لا تُعِد استنتاج الرقمية من خيارات الشحن.** هذا هو العطل نفسه.

---

## مسار الدفع الفعلي — `address → payment → moyasar-callback` (2026-08-29)

**لا توجد خطوة «مراجعة».** الخطوات المرسومة في `checkout-form/index.tsx` هي:

| الخطوة | `?step=` | من ينقل إليها |
|---|---|---|
| العنوان / بيانات التواصل | `address` | البداية |
| الشحن | `delivery` | **لا يُرسم للسلة الرقمية** (`isDigitalOnly = !shippingMethods?.length`) |
| الدفع | `payment` | `setAddresses` ⟵ `lib/data/cart.ts:401` |
| — | — | النموذج يُرسل إلى ميسر مباشرة، والعودة عبر `/[countryCode]/checkout/moyasar-callback` |

فالطلب يكتمل في صفحة الـcallback لا بزر «تأكيد الطلب».

### `Review` حُذف — كان يرسم عنواناً فارغاً في كل عملية شراء

كان `modules/checkout/components/review/` يشترط `searchParams.get("step") === "review"`، و**لا شيء في المستودع كله يضبط تلك القيمة** (فُحص بـ`grep` على `step=review` و`"review"` و`'review'`: صفر نتيجة خارج المكوّن نفسه). فكان الصندوق يُرسم بعنوان «المراجعة» ومحتواه لا يُرسم أبدًا.

> ⚠️ **الأثر لم يكن تجميليًا:** سطر الموافقة على شروط الاستخدام وسياسة الخصوصية وسياسة الاسترجاع كان داخل تلك الكتلة — أي أن **المتجر كان يقبض بلا عرض أي سياسة للمشتري إطلاقًا**.

**اليوم:** سطر الموافقة في `modules/checkout/components/payment/index.tsx`، **فوق نموذج ميسر مباشرة**، بروابط حقيقية (`/terms` · `/privacy-policy` · `/refund-policy`) تفتح بـ`target="_blank"`.

- **لماذا فوق النموذج لا تحته:** هذا هو موضع الدفع الفعلي، وما يقع أسفل حقول البطاقة ليس «قبل الدفع».
- **لماذا تبويب جديد:** السلة تحمل جلسة دفع قائمة، والتنقّل بعيدًا يهجرها.
- **لماذا روابط أصلًا:** `(checkout)/layout.tsx` **لا يستورد `Footer`** — فهذه الروابط هي الطريق الوحيد إلى السياسات من الصفحة التي تطلب الموافقة عليها.

> عند أي تعديل على خطوات الدفع: **لا تُعِد إدخال خطوة `review`** إلا مع ما ينقل إليها فعلًا. وإن نُقل سطر الموافقة، فيجب أن يبقى في مسار يراه المشتري **قبل** الدفع لا بعده.

### `language` يُمرَّر صراحةً إلى `Moyasar.init` — ولا يُترك للاستنتاج

في `moyasar-form/index.tsx`: `language: lang` مأخوذًا من `useLanguage()` — نفس المصدر الذي يغذّي كل نص آخر في صفحة الدفع.

**لماذا لا يُترك فارغًا:** الافتراضي الموثّق لدى ميسر هو **«تُستنتج من وسم `<html>` ثم تسقط إلى `en`»**. و`lib/context/language-context.tsx` يكتب `document.documentElement.lang` في `useEffect` عند التحميل من `localStorage`. فالنتيجة كانت تعتمد على **سباق**: هل كُتبت السمة قبل أن يهيّئ ميسر نفسه (`afterInteractive`) أم بعده — ومَن اختار الإنجليزية مرة واحدة ظل يرى نموذجًا إنجليزيًا وسط واجهة عربية.

> **لا تثبّته على `"ar"`.** المتجر ثنائي اللغة بالكامل، وتثبيت العربية يعطي زائرًا إنجليزيًا نموذج دفع عربيًا وحده.
>
> **وحدّ معروف مقبول:** حارس `initialized` يمنع إعادة البناء، فتبديل اللغة **بعد** ظهور النموذج لا يغيّره حتى إعادة التحميل — متعمَّد، لأن هدم نموذج قائم يمسح بيانات البطاقة المكتوبة.

### `PaymentButton` يتيم بقرار

`modules/checkout/components/payment-button/` بلا مستدعٍ منذ حذف `Review` (كان مستهلكه الوحيد). يحوي منطق `placeOrder` الذي حلّت محله صفحة `moyasar-callback`. **بقي بلا حذف بقرار صريح** — على سنّة `modules/home/components/featured-products/`؛ حذفه قرار منفصل.

### حدّ الخطأ في `(checkout)`

`app/[countryCode]/(checkout)/error.tsx` — أُضيف لأن المجموعة كانت بلا حدّ خطأ، فكان أي فشل يصعد إلى `app/error.tsx` الذي يستبدل الصفحة كلها ويكتفي بـ`console.error` بلا `digest`، فلا يترك للعطل العابر أي أثر يُتتبَّع.

يعرض الآن **`error.digest`** — الرمز الوحيد الذي يربط ما رآه المشتري بسجلات الخادم، لأن الرسالة الحقيقية تُحذف في الإنتاج — ويبدأ بسطر «لم يتم خصم أي مبلغ». رابط «تواصل معنا» فيه **مجرّد بلا منطقة** (`/contact`) عمدًا: هذا الحدّ قد يُرسم بعد فشل في تحليل الـparams التي كان `useParams()` سيقرأها، والـmiddleware يحوّله.

> ⚠️ `app/error.tsx` (الجذري) يرسم `<html>` و`<body>` بنفسه — وهو سلوك ملف `global-error.tsx` لا `error.tsx` في App Router. يعمل عمليًا ولم يُمَس، لكنه يستحق المراجعة إن ظهرت أعطال تخطيط.

---

## صفحة الدفع و`SameSite=Strict` — ولماذا حُذف «استرجاع السلة» (2026-09-03)

> 🚩 **تحذير على هذا القسم كله: جدول السلوك أدناه استنتاج من المواصفة، لا قياس.**
> **لم يُختبر أي من الصفّين الأخيرين على متصفح حقيقي** — و`curl` لا يملك محرّك SameSite إطلاقًا (المُختبِر هو من يقرّر ما يُرسل بـ`-b`)، فكل فحوصنا عاجزة عن حسم هذه المسألة بطبيعتها.
> **لا تستشهد بهذا الجدول كأمر واقع، ولا تبنِ عليه قرارًا جديدًا قبل الفحص في متصفح** (الخطوات في *نقطة الاستئناف* في نهاية الملف).

`_medusa_cart_id` كوكي **`SameSite=Strict`**. والقاعدة التي أضعناها جولتين: **Strict يحجب الإرسال، ولا يحذف الكوكي.**

| الطلب | من أين | الكوكي؟ |
|---|---|---|
| صفحة الـcallback بعد ميسر | **cross-site** (خادم ميسر) | ❌ **لا يُرسل** — ولهذا تحمل `callback_url` مُعرّف السلة |
| نقرة «إعادة المحاولة» على صفحتنا | **same-site** | ✅ **يُرسل** |
| كتابة العنوان يدويًا أو تحديث الصفحة | تنقّل مباشر | ✅ **يُرسل** |

**فصفحة الدفع لا تفقد الكوكي أبدًا في هذا المسار.** الـ404 الذي أصلحناه لم يكن بسبب ضياع كوكي، بل بسبب `notFound()` عند غياب سلة فعلًا — وعلاجه تحويل إلى `/cart?notice=cart_expired`، لا استرجاع.

### ما جُرِّب وحُذف — ولا يُعاد

بُني `app/api/checkout-session/route.ts` + `lib/util/checkout-handoff.ts` (توقيع HMAC للـ`cart_id` في الرابط)، ثم **حُذف الاثنان بالكامل**. سببان، والثاني قاتل:

**1. لا حاجة له.** الحارس كان `cartIdFromUrl !== getCartId()`، والكوكي يصل في النقرة same-site، فالشرط خاطئ والفرع لا يعمل أصلًا.

**2. التوقيع لم يكن يربط بالمستلم.** وقّعنا `cartId + expiry` بسرّ الخادم — أي إثبات أن **الخادم وقّع هذا المعرّف**، لا أنه **لهذا المتصفح**. والمهاجم يحصل على رمز صحيح لسلته بفتح صفحة الدفع الخاصة به وقراءته من الـHTML (وهو حرفيًا ما فعلناه لاستخراج الرمز في الاختبار). فالهجوم يبقى كما هو: سلة بإيميل المهاجم ⟵ رابط للضحية ⟵ الضحية تدفع ⟵ بريد التأكيد و**روابط التحميل** تذهب للمهاجم. التوقيع قلّص النافذة إلى 15 دقيقة ولم يغلق شيئًا.

> ⛔ **لا تُعِد هذه الآلية بتوقيع «أقوى».** أي ربط صحيح يحتاج **قيمة عشوائية مربوطة بالمتصفح** (nonce في كوكي `Lax` + تجزئته داخل الحمولة الموقَّعة) — وذلك ثمن باهظ لمسار **لم يثبت أنه مطلوب**. وإن ظهر يومًا سبب حقيقي، فابدأ بإثبات الحاجة في **متصفح** لا بـ`curl`.
>
> 🔬 **`curl` لا ينفّذ دلالات SameSite إطلاقًا** — أنت من تقرر ما يُرسل بـ`-b`. فأي اختبار بـ`curl` يستطيع إثبات أن الاسترجاع **يعمل**، ولا يستطيع إثبات أنه **مطلوب**. هذا بالضبط ما أخفى الخطأ حتى المراجعة الثانية.

> ⛔ **ولا تُرخِ الكوكي إلى `Lax`** كعلاج لأي عرَض هنا: إضعاف CSRF على المسار الوحيد الذي يحرّك المال.

### ⚠️ ثغرة قائمة موثّقة — `moyasar-callback` يقبل أي `cart_id`

الصفحة تقرأ `cart_id` من الرابط بلا أي تحقق ملكية، ثم تُشغّل `initiatePaymentSession` و`completeCart` عليه. أي أن نداءً كهذا يدفع مسار إكمال طلب على سلة لا يملكها المنادي:

```
/checkout/moyasar-callback?status=paid&id=<دفعة>&cart_id=<أي سلة>
```

**ما يحتويها اليوم في الباك إند وحده:** `authorizePayment` يتحقق من الدفعة server-to-server مع ميسر بالمفتاح السري، **ويقارن المبلغ والعملة** بالجلسة (قسم ثغرة مقارنة المبلغ أعلاه) — فدفعة مخترَعة أو غير مطابقة تُرفض بدل أن تُكمل طلبًا.

**الإغلاق الصحيح** ربط مُعرّف السلة بجلسة المشتري **قبل** مغادرته إلى ميسر — وهو نفس الربط الذي كان ينقص التوقيع المحذوف. **تغيير مستقل، ولا يُرقَّع بسطر هنا.** وهو مرشّح لقائمة ما قبل تفعيل Moyasar الحي.

### فروع `moyasar-callback` — القاعدة تُطبَّق على المسار كله لا على فرع

`status === "paid"` هو الخط الفاصل: ميسر لا يرسله إلا بعد تحرّك المال.

| الفرع | الموضع | `variant` |
|---|---|---|
| `canceled` · `failed` · حالة غير معروفة | **قبل** الخصم | `retry` |
| **`paid` بلا `payment id`** | بعد | `paid` (بلا مرجع — يُبحث عنه في لوحة ميسر بالوقت والمبلغ) |
| **السلة غير موجودة بعد `paid`** | بعد | `paid` + مرجع |
| **`initiatePaymentSession` فشل** | بعد | `paid` + مرجع |
| `completeCart` فشل | بعد | `paid` + مرجع |

> ⚠️ **ثلاثة من هذه الخمسة كانت تعرض «إعادة المحاولة» بعد الخصم** — دعوة صريحة لخصم ثانٍ. أخطرها فرع `initiatePaymentSession`: كان رابطه **مكسورًا** (ينتهي بـ404 لضياع الكوكي)، وإصلاح الـ404 **جعله يعمل**. الدرس: **عند إصلاح مسار مكسور، افحص ما الذي كان الكسر يحجبه.**
>
> وحُذف `variant="cart-gone"` مع مستدعيه الوحيد: كان يقول «انتهت الجلسة، عد للمتجر» **لمن دُفع من حسابه للتو**.

### `clearFailStyling` — إزالة واحدة لا تكفي

MPF يضبط علم `fail` بـ`setState` مُجمَّع ثم ينادي `on_failure` **في نفس التكّة**، فالصنف `mysr-form-fail` **ليس في الـDOM بعد** لحظة نداء دالتنا — ويُعاد تطبيقه في كل رندر طوال مؤقّته البالغ 3 ثوانٍ. أي أن الإزالة الواحدة (وحتى المؤجَّلة بـ`setTimeout(…,0)`) **لا تفعل شيئًا**، والزر الأحمر بلا نص كان لا يزال يظهر رغم «إصلاحه».

**اليوم:** `MutationObserver` على حاوية النموذج يجرّد الصنف كلما أُعيد، ويُفصل بعد **3.5 ثانية** (بعد انتهاء مؤقّت MPF)، مع تنظيف عند فكّ التركيب. **لا تستبدله بإزالة واحدة.**

### تصنيف أخطاء الدفع — ترتيب الأنماط سلوك لا تجميل

في `lib/util/payment-errors.ts` الترتيب هو المنطق. `network` (النقل) يُختبر **قبل** `card_declined`، لأن نمط الأخير يحوي `\brefus` و`issuer` — فكانت `Connection refused` تُصنَّف **رفض بطاقة**، فيُقال للمشتري «جرّب بطاقة أخرى» بينما البوابة غير قابلة للوصول؛ يجرّب بطاقات بلا داعٍ ويُلوَّث كل تشخيص لاحق. حدّ `\b` كان يحمي من `ECONNREFUSED` الملتصقة وحدها.

**الترتيب اليوم:** `network` (الخدمة غير متوفرة) ← `three_ds_failed` ← **`network` (النقل)** ← `card_declined` ← `session_expired`. و`issuer` تبقى مع `card_declined` عمدًا: مُصدِر متوقف فعلًا حالة «جرّب بطاقة أخرى».

### إشعارات صفحة السلة

`cart_expired` (لا سلة) و`cart_unavailable` (الباك إند لا يُوصل إليه) **منفصلان عمدًا**: الثاني يجب ألا يُقال بلسان الأول أبدًا — السلة سليمة، ونحن من فشل في الوصول إليها، و«انتهت جلستك» تدعو المشتري لإعادة بناء سلة قائمة.

> 🔒 البحث في `NOTICES` يمرّ بـ`Object.hasOwn`. القيمة تأتي من الـquery خامًا، و`?notice=constructor` كان يُرجع دالة من `Object.prototype` فيُرسم الصندوق بخطأ React داخله.

### التجارب الأربع — أعِدها كاملة عند أي تعديل على هذا المسار

بلا جرّة كوكيز (قاعدة الزاحف أعلاه تنطبق هنا: الجرّة تخفي فئة أعطال الكوكي المفقود):

| # | الحالة | المتوقع |
|---|---|---|
| 1 | كوكي سلة صالح | **200**، صفر تحويلة |
| 2 | بلا كوكي | 307 ⟵ `/cart?notice=cart_expired` ⟵ 200 |
| 3 | باك إند ساقط **+ كوكي** | **500** بـ`digest` (حدّ خطأ `(checkout)`) — **لا 404** |
| 4 | باك إند ساقط **+ بلا كوكي** | ⟵ `cart_expired`، ولا 404 |

> ⚠️ **الحالتان 3 و4 منفصلتان لأن 3 وحدها كانت تُمرِّر عطلًا في 4.** و`throwOnFailure` **لا يُنقذ 4**: `retrieveCart` يُرجع `null` **قبل أي نداء شبكة** حين لا يوجد معرّف (`cart.ts`: `if (!id) return null`).
>
> **وحدّ معروف:** أثناء انقطاع كامل تُرجع صفحة السلة 500 على أي حال، لأن تخطيط `(main)` نفسه يقرأ من الباك إند — سبب سابق لهذا الإصلاح ولم يُمَس.

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

> ✅ **مراجعة 2026-08-29 — التصنيف لم يتغيّر، وصار أدق.** عُدِّل نص `/refund-policy` فاستُثنيت **الحالات الأربع المؤهلة** من قيد الـ7 أيام: كان بند «مرور أكثر من 7 أيام» في قسم *حالات لا تستوجب الاسترداد* يبتلع القسم الذي قبله، فملف تالف يُكتشف في اليوم الثامن يسقط حقه **نصًّا** بينما القسم الأعلى لا يزال يسمّيه مؤهلًا.
>
> **ولماذا لا يمسّ هذا `MerchantReturnNotPermitted`:** الاستثناء **يرفع قيدًا زمنيًا عن علاج عيب، ولا يفتح نافذة إرجاع اختياري**. المبدأ العام كما هو حرفيًا («بمجرد تسليم المنتج الرقمي أو الإفصاح عن محتواه، لا يمكن إرجاعه أو استرداد قيمته»)، والحالات الأربع تبقى ما كانت: علاج عيب في المنتج أو في عملية الدفع. فالتصنيف الأضيق ما زال الأصدق — بل صار أصدق، لأن أي التباس بنافذة 7 أيام ضمنية زال.
>
> ⛔ **ولا يجوز أن يُستدَل بهذا الاستثناء على إضافة `merchantReturnDays`.** إضافته تعلن نافذة إرجاع بالأيام، وهي بالضبط ما تنفيه السياسة. فُحص بعد التعديل على صفحة منتج مولَّدة: `merchantReturnDays` **غائب** و`returnPolicyCategory` هو `MerchantReturnNotPermitted`.
>
> **ما صُحِّح معه في نفس الجولة** (كان يناقض التصنيف فعلًا): تبويب «سياسة الاسترجاع» في صفحة المنتج كان يعلن «**استرداد سهل**» و«**استبدال سهل**» — أي أن الـschema كان يقول «لا إرجاع» والصفحة تعد بإرجاع سهل. صار التبويب ينقل المبدأ العام ويعدّد الحالات الأربع ويربط بـ`/refund-policy`.

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
| **رابط موقّع** | 7-day presigned R2 URL for PDF download |
| **مفتاح الأسلوب** | Style-variable feature in `chatgpt-arabic-prompts`: `[الأسلوب: فصحى رسمية / فصحى مُيسَّرة / خليجية]` |
| **railway up** | Manual storefront deploy — always from repo root with explicit IDs |
| **صفحة التأكيد** | `/[countryCode]/order/[id]/confirmed` — shows download links post-payment |

---

## Security — Admin Credential Incident (resolved 2026-07-27)

**ما حدث:** مراجعة أمنية شاملة (git history secrets scan) اكتشفت أن `scripts/reupload-product-images.py` كان يحتوي على بيانات دخول أدمن حقيقية بنص صريح لحساب `admin@promptr.com` على الباكند الحي (`api.promptrsa.com`) — أخطر ثغرة وُجدت في تلك المراجعة.

**المعالجة** — ✅ **تحقّق فعلي (2026-09-03)**، لم تعد بلاغ فريق: جرّب المستخدم تسجيل الدخول بالاعتماد المسرّب على `api.promptrsa.com` **ففشل**. الحساب محذوف والاعتماد **ميت**:
- أُنشئ حساب أدمن جديد بإيميل حقيقي `team.promptr@gmail.com` عبر **Railway Console** (تبويب Console في لوحة الخدمة)
- حُذف `admin@promptr.com` القديم نهائيًا (كان إيميلًا وهميًا بكلمة مرور مكشوفة)
- أُزيل `scripts/reupload-product-images.py` من شجرة الريبو — commit `c3f4f00` (تحقّق مباشر: Claude نفّذ هذا الكوميت)

**ملاحظة تقنية لأي محاولة مستقبلية مشابهة:** لا تستخدم `railway ssh` + `npx medusa user` كأول خيار لإدارة مستخدمي الأدمن على الباكند الحي. واجهنا فشلين متتاليين بهذا المسار: (1) مفتاح SSH/ثقة المضيف غير مُعدَّين افتراضيًا محليًا، (2) بعد حلّها، فشل CLI بخطأ "must be run inside a Medusa project" لأن جلسة SSH تهبط في جذر المونوريبو `/app` لا `apps/backend` (يحتاج `cd apps/backend &&` قبل أي أمر `medusa`) — ولم نتحقق أبدًا من نجاح المحاولة بعد هذا التصحيح. **المسار الذي نجح فعليًا: تبويب Console في لوحة خدمة Railway مباشرة.** ابدأ به أولًا في المرة القادمة.

### 🔍 الفحص الشامل للتاريخ (2026-09-03) — **لا تُعِده بلا سبب**

فُحص **تاريخ المستودع كاملًا** بحثًا عن أي سرّ آخر. النتيجة مسجّلة هنا حتى لا يُعاد الفحص من الصفر.

| | |
|---|---|
| **النطاق** | **202 كوميت** — من `b38e1ee` (2026-06-18، أول كوميت) إلى `8960a5e` (2026-09-02)، على **كل** الفروع |
| **العمق** | **2,623 كائنًا**؛ فُحص كل blob نصي عبر `git rev-list --objects --all` — لا `HEAD` وحده، فالسر المحذوف يبقى في التاريخ |
| **المستثنى** | الثنائيات (pdf/صور/خطوط) و`node_modules` |

**المنهج — تمريرتان:**
1. **نمطية:** `sk_live_` · `sk_test_` · `pk_live_` · `re_…` (Resend) · `AKIA…` · JWT (`eyJ….eyJ…`) · `BEGIN … PRIVATE KEY` · `postgres://user:pass@` · `redis://:pass@` · `mongodb://…` · وأي `SECRET|PASSWORD|TOKEN|API_KEY|ACCESS_KEY|PRIVATE_KEY = <قيمة ≥8 محارف>`
2. **مستهدفة بالأسماء:** `MOYASAR*` · `RESEND*` · `S3_*` · `DATABASE_URL` · `REDIS_URL` · `RAILWAY*` · `MIGRATE_SECRET` · `WEBHOOK*` — مع استبعاد قراءات `process.env` والنوائب

**النتيجة: سرّ حقيقي واحد في كل التاريخ — وهو ميت.**

| النوع | الموضع | الحالة |
|---|---|---|
| كلمة مرور أدمن Medusa | `scripts/reupload-product-images.py:20` — أُضيف `754c9a1`، حُذف `c3f4f00` | 💀 **ميت** (البند 1 أعلاه) |

✅ **صفر** مفتاح Moyasar حي · **صفر** مفتاح Cloudflare R2 · **صفر** مفتاح Resend · **صفر** رابط قاعدة بيانات أو Redis يحمل اعتمادًا · **صفر** رمز Railway · **صفر** JWT · **صفر** مفتاح خاص.

**وما ظهر في الفحص وليس سرًّا** (لا تُبلّغ عنه ثانيةً): نوائب `supersecret` في `.env.template` بالمشروعين · `REDIS_URL=redis://localhost:6379` و`ADMIN_CORS=http://localhost…` في القوالب · `MOYASAR_API_URL` (عنوان عام موثّق) · `RAILWAY_SERVICE="f7497b9a-…"` في `deploy.sh` (**معرّف خدمة لا رمز وصول**) · قراءات `process.env.X || ""` · روابط صور Railway العامة · أسماء المتغيرات في `CLAUDE.md`.

**و`.env.production` — تحقق مستقل يؤكد تدقيق 2026-08-07:** كل نسخة تاريخية من الملفين (3 blobs) لا تحمل إلا `MEDUSA_DISABLE_ADMIN` · `MEDUSA_BACKEND_URL` · `NEXT_PUBLIC_*`. **صفر متغير سرّي، لا تدوير مطلوب.**

### ما نُفِّذ في نفس الجولة (2026-09-03)

- **حُذف `scripts/reupload-product-images.py` من القرص نهائيًا.** كان قد عاد كنسخة عمل غير متتبَّعة بعد حذفه من الريبو في `c3f4f00`. **نسخة احتياطية خارج المستودع:** `~/promptr-backups/` (بصلاحيات `600`) — منطق السكربت متاح إن لزم، والتاريخ يحتفظ بالأصل (`git show 754c9a1:scripts/reupload-product-images.py`).
- **نُقّيت كلمة المرور من `.claude/settings.local.json`** — كانت في سطرَي صلاحيات لأمر `curl` على `/auth/user/emailpass`، وهي الدليل الذي أثبت أن الاعتماد كان **مستعمَلًا فعلًا** لا قيمة اختبارية. الملف غير متتبَّع ومُتجاهَل عالميًا، فلم يدخل أي كوميت.
- **أُصلح سطر ملتصق في `.gitignore`** كان يُبطل قاعدتين معًا:
  ```
  **/.DS_Storescripts/reupload-product-images.py     ← سطر واحد، بلا فاصل
  ```
  فلم يكن `**/.DS_Store` يعمل **ولا** السكربت مُتجاهَلًا — ولهذا عاد الأخير يظهر في `git status` قابلًا لـ`git add -A` عابر. صار سطرين، وأُضيف `.claude-flow/`.
  > 🔎 **درس:** ملف `.gitignore` بلا سطر جديد في نهايته يبتلع أول قاعدة تُضاف بعده صامتًا. **بعد أي إضافة، تحقّق بـ`git check-ignore -v <path>` لا بالنظر إلى الملف.**

### قبل تفعيل Moyasar الحي — قائمة تحقق إلزامية

لا يجوز تفعيل حساب Moyasar للدفع الحي قبل إتمام كل ما يلي:
1. ~~**تنظيف git history من كلمة المرور القديمة**~~ — ✅ **مغلق بقرار صريح (2026-09-03): لن يُنظَّف التاريخ.** الاعتماد ما زال قابلًا للاسترجاع من `754c9a1` (`git rm --cached` لا يمس التاريخ) — **لكنه ميت**، والمستودع يتحول إلى private.
   **سبب القرار:** إعادة كتابة `main` بـ`force-push` مخاطرة حقيقية (تكسر كل نسخة مستنسخة، وتُبطل مراجع الكوميتات في هذا الملف نفسه) **لا تبررها الفائدة**: السر ميت، فالتنظيف لا يستردّ شيئًا. وGitHub يُبقي الكائنات غير المرتبطة قابلة للوصول بالـSHA بعد الـforce-push إلى أن يُطلب من الدعم جمعها — أي أن العائد الأمني منقوص أصلًا.
   > ⚠️ **هذا القرار مشروط بموت السرّ.** لو تسرّب يومًا اعتماد **حيّ**، فالترتيب يعود: **تدوير فورًا أولًا**، ثم يُعاد وزن تنظيف التاريخ من جديد. لا تستشهد بهذا البند كسابقة لسرّ حي.
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
  - **مدة الرابط الموقّع**: `EXPIRY_SECONDS` في `utils/signed-url.ts` = **`604800` (7 أيام)**.
    > 🔁 **قُصِّرت إلى 48 ساعة في 2026-08-08 ثم أُعيدت إلى 7 أيام في 2026-09-07 بقرار المالك.** سبب الإعادة: 7 أيام هو **الحد الأقصى** الذي يقبله توقيع SigV4 (أي قيمة أعلى يرفضها S3/R2 عند التوقيع)، وتقليل رسائل «الرابط انتهى» — المشتري يفتح بريد الطلب متأخرًا، والنافذة القصيرة لم تشترِ الكثير عمليًا.
    > **وما يبقي الخطر محدودًا رغم الإطالة:** الرابط لا يُسجَّل في أي لوق إطلاقًا، وصفحة التأكيد و`/store/order-downloads` تولّدان رابطًا جديدًا كل زيارة **خلف فحص ملكية** — فالرابط المنتهي ليس الطريق الوحيد للملف.
    > ⛔ **والمدة مذكورة في أربعة مواضع يجب أن تتغيّر معًا:** `signed-url.ts` · `email-templates.ts` (نص البريد) · `order/components/download-links` (صفحة التأكيد) · وهذا الملف. اختلاف أحدها يَعِد المشتري بما لا يصحّ — وهو ما وقع فعلًا: كانت صفحة التأكيد تقول «7 أيام» والرابط ينتهي بعد 48 ساعة.
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

- 🧵 **خيط مشتبه به (لم يُعالَج — سُجِّل 2026-09-02): عمرا الكوكيين مختلفان.** `_medusa_cart_id` عمره **7 أيام** (`lib/data/cookies.ts:77`) بينما `_medusa_cache_id` عمره **24 ساعة** (`middleware.ts:156` و`187`).
  **لماذا قد يهمّ:** وسم الكاش لكل بيانات المتجر مشتق من `_medusa_cache_id` (`getCacheTag` ⟵ `` `${tag}-${cacheId}` ``). فبعد 24 ساعة تنتهي صلاحية الكوكي، ويولّد الـmiddleware `cacheId` جديدًا، فينتقل الزائر إلى **فضاء وسوم جديد كليًا** — وكل ما خُزِّن تحت الوسم القديم يصير معزولًا لا يصل إليه `revalidateTag` أبدًا. وأسوأ: إن غاب الكوكي لحظة الطلب، يُرجع `getCacheTag` **سلسلة فارغة**، فيُرجع `getCacheOptions` كائنًا فارغًا، فتُخزَّن الاستجابة بـ`cache: "force-cache"` **بلا أي وسم** — أي **بلا طريق لإبطالها إطلاقًا**.
  **المشكلة المرشَّحة:** صفحة المنتج تعرض أحيانًا **سعرًا قديمًا بعد تعديله من لوحة Medusa**. الشكل يطابق: السعر يُقرأ عبر نفس مسار `force-cache` الموصوف في البند التالي، وإبطاله يعتمد على وسم قد يكون فارغًا أو منتميًا لفضاء منقرض.
  > ⚠️ **خيط لا تشخيص.** لم يُقس، ولم يُربط بالسعر القديم بدليل. **لا توحّد العمرين كإصلاح قبل القياس** — قد يكون السبب الحقيقي هو `force-cache` بلا `revalidate` في البند التالي، وتوحيد العمرين حينها يغيّر سلوك الكاش بلا أن يحلّ شيئًا. اقتُطع عمدًا من كوميت إصلاح 404 صفحة الدفع (2026-09-02) لأنه مشكلة منفصلة.

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

   **حالة الكود (مُحدَّث 2026-08-29):** الحساب أُنشئ ومعرّف الناشر `ca-pub-1113985459345993`. **الوسمان في ملفين مختلفين الآن**، والمعرّف في وحدة واحدة تغذّيهما — `lib/util/adsense.ts` — فلا ينزاح أحدهما عن الآخر:

   | الوسم | الوظيفة | موضعه |
   |---|---|---|
   | `<meta name="google-adsense-account">` | **إثبات الملكية** | `metadata.other` في `app/layout.tsx` (الـroot) — **على مستوى الموقع** |
   | `<script async crossorigin src="…adsbygoogle.js?client=…">` | **عرض الإعلانات** | JSX في `app/[countryCode]/(main)/blog/layout.tsx` — **المدونة وحدها** |

   لا يتعارضان، ويجب بقاؤهما معًا: حذف الميتا يكسر التحقق، وحذف السكربت يمنع الإعلانات. **ولا يجوز جمعهما في ملف واحد ثانيةً:** الميتا لازمها النطاق الكامل (الزاحف يفحص الرئيسية)، والسكربت لازمه الحصر (لا شأن لصفحة الدفع بسكربت إعلانات طرف ثالث).

   ### مسار إثبات الملكية — ثلاث محاولات، رفضان

   | # | ما جُرّب | النتيجة |
   |---|---|---|
   | 1 | سكربت محصور في `/blog` عبر `next/script` | ❌ رفض — الزاحف يفحص **الصفحة الرئيسية** ولم يكن فيها |
   | 2 | سكربت على مستوى الموقع، ثم وسم `<script>` خام يظهر فعليًا في HTML الصادر من الخادم (مؤكَّد بـ`curl`) | ❌ رفض **رغم ظهوره** — أي أن وجود السكربت في HTML الخام **ليس** كافيًا لهذا الفحص |
   | 3 | `<meta name="google-adsense-account">` عبر `metadata.other` | ❌ رفض في حينه — **والسبب لم يكن الوسم** |
   | 4 | الوسم نفسه بعد إصلاح حلقة الكوكيز **وإعادة كتابة الجذر** | ✅ **الملكية مثبتة** (حسب ما أبلغ المستخدم 2026-08-06) |

   **الدرس الأهم:** الرفضات الثلاثة الأولى لم تكن بسبب الوسوم — الثلاثة (ميتا + سكربت + `ads.txt`) كانت مؤكَّدة حيًّا بـ`curl` طوال الوقت. السبب كان **أن الزاحف لا يصل للصفحة أصلًا**: حلقة كوكيز لا تنتهي، ثم جذر يُحوَّل بدل أن يُجيب. أضعنا ثلاث محاولات ونحن نبدّل الوسوم بينما العطل في طبقة الوصول.

   **الخلاصة العملية:** لأي تحقق ملكية مستقبلي — **تحقق أولًا أن الزاحف يستلم HTML فعلًا** (`curl` بلا كوكيز، بهوية الزاحف، على **العنوان المطلوب تحديدًا**)، ثم اهتم بالوسم. وابدأ بالعلامة الوصفية عبر `metadata.other` لا بالسكربت.

   **حالة AdSense (2026-08-29):** ✅ **الملكية مثبتة** بالعلامة الوصفية · ✅ **الموقع مربوط ومقبول** — بطاقة اللوحة تقول «نشكرك على ربط الموقع الإلكتروني» بمؤشر أخضر، والمتبقي معلومات الدفع وحدها · 🚫 لا وحدة إعلانية منشورة. *(الحالة كما أبلغ المستخدم — لا يمكن التحقق منها برمجيًا من هنا.)*

   > ⚠️ **لماذا خرج السكربت من `/blog` ثم عاد إليه:** حصره في `/blog` عبر `next/script` كان سبب الرفض الأول (الزاحف يفحص الرئيسية)، فوُسِّع إلى الـroot مؤقتًا. **وبعد القبول أُعيد الحصر (2026-08-29، كوميت `61e5b78`)** — لكن **لا** باسترجاع المكوّن `modules/common/components/adsense-script` من تاريخ git كما كان مخططًا هنا: ذلك المكوّن يستعمل `next/script` (لا يراه الزاحف) وقائمة استثناءات سوداء (`/account`, `/checkout`) تجعل كل مسار جديد يرث الإعلانات افتراضيًا. **الوسم الخام في `blog/layout.tsx` بديلٌ أفضل منه** — حدود المجلد قائمة بيضاء تلقائية. و**الميتا بقيت على مستوى الموقع** كما تقتضي القاعدة.

   **`ads.txt` منشور** — `apps/storefront/public/ads.txt`، سطر واحد: `google.com, pub-1113985459345993, DIRECT, f08c47fec0942fa0`. تحقّق حي على `promptrsa.com/ads.txt`: **200، `text/plain; charset=UTF-8`، صفر تحويلات**. سبب أهمية «صفر تحويلات»: الـmiddleware يضيف بادئة المنطقة لكل مسار، وكان يمكن أن يحوّله إلى `/sa/ads.txt` فيراه زاحف Google 404 — لكنه يمرّر أي مسار يحوي نقطة (`pathname.includes(".")`) مباشرة، فيُقدَّم من الجذر كما تتطلب المواصفة. **أي ملف جذري مستقبلي بلا امتداد سيحتاج معالجة خاصة في الـmiddleware.**

   **Google Search Console (2026-08-06):** الموقع **موثّق** عبر ملف HTML: `apps/storefront/public/google46f0b93ef93c8597.html` بمحتوى سطر واحد. يُقدَّم من الجذر بـ200 وصفر تحويلات (مسار ذو نقطة ⇐ يتخطى الـmiddleware، نفس آلية `ads.txt`). **لا تحذف الملف** — حذفه يُلغي التوثيق. وحسب ما أبلغ المستخدم: `sitemap.xml` أُرسل، والصفحة الرئيسية فُهرست.

   > 🚫 **لا توجد أي وحدة إعلانية (ad unit) في أي مكان** — المضاف هو المكتبة فقط لأجل التحقق. حين تُضاف الوحدات فموضعها `blog/layout.tsx` وحده (التعليق هناك يوثّق ذلك)، ولا تدخل صفحات المتجر أو المنتج أو الدفع.

   > 🔎 **درس مقيس يبقى صالحًا رغم انتقالنا للميتا: `next/script` لا يضع وسمًا في HTML الصادر من الخادم.** القياس تم على **بناء إنتاج حقيقي** (`next build` + `next start`) بفحص HTML الخام بـ`curl` — لا على خادم التطوير، لأن سلوكهما يختلف:
   >
   > | الطريقة | ما يظهر في HTML الصادر من الخادم |
   > |---|---|
   > | `next/script` بـ`afterInteractive` | `<link rel="preload" as="script">` فقط — الوسم يُحقن بعد الترطيب |
   > | `next/script` بـ`beforeInteractive` | **نفس الشيء تمامًا** — `<link rel="preload">` فقط، خلافًا للمتوقع |
   > | `<script async crossorigin>` عادي داخل مكوّن خادم (أي layout) | ✅ وسم `<script>` فعلي داخل `<head>` في HTML الأولي — React يرفعه تلقائيًا |
   >
   > كان مكتوبًا هنا سابقًا أن `beforeInteractive` هو الحل — **وكان افتراضًا غير مقيس وخاطئًا**. الحل الوحيد الذي يراه الزاحف هو الوسم الخام، وهو حرفيًا ما تعطيه Google. React يرفعه إلى `<head>` تلقائيًا.

   > 📍 **النطاق الحالي (2026-08-29):** السكربت في `app/[countryCode]/(main)/blog/layout.tsx` **وحده**. صفحات المتجر والمنتج والسلة والدفع والحساب **لا تحمّله إطلاقًا**.
   >
   > قياس على الإنتاج بعد النشر، بلا جرّة كوكيز — عدّ وسم `adsbygoogle.js` مقابل وسم `google-adsense-account`:
   >
   > ```
   > /sa · /sa/store · /sa/cart   script=0  meta=1
   > /sa/blog                     script=1  meta=1
   > ```
   >
   > **لا «تصلح» غياب السكربت عن صفحات المتجر — هذا هو المطلوب.** وأي إعادة توسيع تحتاج سببًا صريحًا، لأن ما دفع إليه أول مرة (اجتياز التحقق) انقضى.

   > ✅ **صُحِّح 2026-08-29:** كان مكتوبًا هنا أن «صفحات المنتجات ما زالت خارج `sitemap.xml`» — **وهو قديم ويناقض قسم المدونة في هذا الملف نفسه**. أُدرجت المنتجات الـ12 في **2026-08-11**، والخوف الذي بُني عليه القرار الأصلي (أن استدعاء الباكند وقت البناء يُفشل البناء) عولج بأربع طبقات في `app/sitemap.ts` لا بالاستبعاد: `fetch` مباشر · مهلة 8 ثوانٍ · `revalidate = 3600` · و`try/catch` يُرجع الثوابت والمقالات عند أي فشل. التفاصيل في قسم *المدونة*، ولا تُكرَّر هنا.
   >
   > **قياس حي (2026-08-29):** `promptrsa.com/sitemap.xml` ⟵ 200، و**37 رابطًا = 8 ثوابت + 17 مقالًا + 12 منتجًا**.

---

## الخطوة التالية: بناء أرشيف المقالات

**الهدف:** 15–20 مقالًا أصليًا منشورًا — وهو ما يحتاجه تقديم AdSense (البند 3 أعلاه). المنشور اليوم: **17 مقالًا** (الجدول في قسم *المدونة*) — أي أن عتبة العدد لم تعد مانعًا للتقديم.

**مصدر المواضيع:** محتوى المنتجات الـ12 نفسها — كل دليل يعطي 3–4 مقالات مستقلة، فالكتالوج وحده يغطي الهدف بالكامل بلا بحث خارجي. (المقال الثاني مثال: مستخرج من القسم 2 في `products/ecommerce-success-guide/data.json`.)

**قاعدتان ثابتتان لكل مقال — لا استثناء:**
1. **قيمة كاملة بلا بتر** — المقال يقف بذاته ويعطي الإجابة كاملة. لا تُحجب خطوة أو معلومة لدفع القارئ نحو المنتج؛ الإحالة للمنتج تأتي في الخاتمة كتوسيع طبيعي لا كشرط لاكتمال الفائدة.
2. **لا أرقام متغيرة** — ممنوع ذكر أسعار أو رسوم أو عمولات أو حدود خطط. تتغيّر باستمرار وتُقادم المقال. اذكر الفرق الجوهري (الفلسفة، التكامل، لمن يناسب) وأحل القارئ للموقع الرسمي للأرقام المحدّثة.
