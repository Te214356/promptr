/**
 * مقياس دائم لسلوك كوكي السلة (`SameSite=Strict`) ولمسار «إعادة المحاولة».
 *
 * ⛔ **أعِد تشغيله عند أي تغيير يمسّ:** خصائص كوكي `_medusa_cart_id`
 * (`lib/data/cookies.ts`) · صفحة `moyasar-callback` · صفحة `checkout` ·
 * أو `middleware.ts`. هذه المسألة **لا يحسمها `curl`** — لا يملك محرّك
 * SameSite أصلًا، والمُختبِر هو من يقرّر ما يُرسل بـ`-b`.
 *
 * التشغيل (من جذر المستودع):
 *
 *   npx playwright@latest install webkit     # مرة واحدة على الجهاز
 *   npm i --no-save playwright-core          # بلا أثر على package.json
 *   node apps/storefront/scripts/samesite-probe.mjs
 *
 * ما يقيسه، وكلٌّ على الموقع الحي بمحرك سفاري نفسه:
 *
 *   [ضابط موجب] تنقّل مباشر ⟵ يجب أن تُوجد السلة. **بدون هذا الضابط القياس
 *               باطل:** نتيجة `cart_expired` تصير ملتبسة بين «الكوكي محجوب»
 *               و«لا سلة أصلًا».
 *   [الصف 1]    نقرة cross-site ⟵ يجب ألا تُوجد السلة (الكوكي محجوب)
 *   [الصف 2]    نقرة same-site  ⟵ يجب أن تُوجد
 *   [ب3]        وصول cross-site إلى الـcallback بـ`status=failed` ثم نقر
 *               «إعادة المحاولة» ⟵ **يجب أن تظهر خطوة الدفع بالسلة سليمة**
 *
 * ⚠️ **ملاحظة على القياس لا ثغرة فيه:** الوصول هنا **نقرة رابط** من أصل آخر،
 * وعودة ميسر الحقيقية **تحويل 302**. كلاهما تنقّل cross-site من المستوى
 * الأعلى، و`Strict` يحجب في الحالتين — لكنهما ليسا الشيء نفسه حرفيًا.
 * ⛔ **ولو أُرخي الكوكي إلى `Lax` لاختلفا:** الـLax يُرسل في تنقّل GET من
 * المستوى الأعلى، فتصير هذه الحالة غير ممثِّلة، **ويسقط CSRF عن المسار
 * الوحيد الذي يحرّك المال**. سبب إضافي لعدم إرخائه.
 *
 * 🔒 صفر أثر خارجي: لا دفعة ولا نداء لميسر — فرع `failed` يصنّف ويسجّل ويعرض،
 * ولا يقرأ السلة ولا الكوكي.
 */

import { webkit } from 'playwright-core';
import { createServer } from 'node:http';

const SITE = 'https://promptrsa.com';
const CHECKOUT = `${SITE}/sa/checkout?step=payment`;

// خادم من أصل مختلف (منفذ ومخطط ومضيف مختلفة) ⟵ cross-site حقيقي
const server = createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(`<!doctype html><meta charset=utf-8><body>
    <a id="toCheckout" href="${CHECKOUT}">checkout</a>
    <a id="toCallback" href="${SITE}/sa/checkout/moyasar-callback?status=failed&id=pay_probe_not_real&message=Insufficient%20funds">callback</a>
  </body>`);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const OTHER = `http://127.0.0.1:${server.address().port}/`;
console.log(`أصل خارجي: ${OTHER}\n`);

const b = await webkit.launch();
const ctx = await b.newContext({ viewport:{width:1280,height:900}, locale:'ar-SA' });
const page = await ctx.newPage();

const classify = (url) =>
  url.includes('notice=cart_expired') ? '❌ cart_expired (لم تُوجد السلة)'
  : url.includes('/checkout') ? '✅ خطوة الدفع (وُجدت السلة)'
  : `؟ ${url}`;

const cookieNames = async () =>
  (await ctx.cookies(SITE)).map(c => c.name).join(',') || '(لا شيء)';

// ── بناء سلة حقيقية بالواجهة
await page.goto(`${SITE}/sa/products/ai-basics-arabic`, { waitUntil:'networkidle', timeout:60000 });
await page.getByRole('button', { name:/أضف للسلة/ }).first().click();
await page.waitForTimeout(6000);
console.log(`كوكيز الموقع بعد الإضافة: ${await cookieNames()}`);

// ── الضابط الموجب: هل السلة موجودة ويمكن بلوغها أصلًا؟
await page.goto(CHECKOUT, { waitUntil:'networkidle', timeout:60000 });
console.log(`\n[ضابط موجب] تنقّل مباشر ⟵ ${classify(page.url())}`);
console.log(`             (وهو أيضًا الصف الثالث في جدول SameSite)`);

// ── الصف الأول: تنقّل cross-site
await page.goto(OTHER, { waitUntil:'domcontentloaded' });
await Promise.all([page.waitForNavigation({ timeout:60000 }), page.click('#toCheckout')]);
await page.waitForLoadState('networkidle').catch(()=>{});
console.log(`[الصف 1] نقرة cross-site ⟵ ${classify(page.url())}`);

// ── الصف الثاني: نقرة same-site
await page.goto(`${SITE}/sa/cart`, { waitUntil:'networkidle', timeout:60000 });
await page.evaluate((href) => {
  const a = document.createElement('a');
  a.id = 'sameSiteProbe'; a.href = href; a.textContent = 'probe';
  document.body.appendChild(a);
}, CHECKOUT);
await Promise.all([page.waitForNavigation({ timeout:60000 }), page.click('#sameSiteProbe')]);
await page.waitForLoadState('networkidle').catch(()=>{});
console.log(`[الصف 2] نقرة same-site ⟵ ${classify(page.url())}`);

// ── ب3: التسلسل الحقيقي — وصول cross-site إلى الـcallback ثم نقرة «إعادة المحاولة»
await page.goto(OTHER, { waitUntil:'domcontentloaded' });
await Promise.all([page.waitForNavigation({ timeout:60000 }), page.click('#toCallback')]);
await page.waitForLoadState('networkidle').catch(()=>{});
const heading = await page.locator('h1').first().textContent().catch(()=>null);
const retry = page.getByRole('link', { name:/إعادة المحاولة/ });
console.log(`\n[ب3] صفحة الـcallback: العنوان="${(heading||'').trim()}" · زر إعادة المحاولة موجود=${await retry.count() > 0}`);
await page.screenshot({ path:'/tmp/shots/b3-callback.png' });

await Promise.all([page.waitForNavigation({ timeout:60000 }), retry.first().click()]);
await page.waitForLoadState('networkidle').catch(()=>{});
console.log(`[ب3] بعد «إعادة المحاولة» ⟵ ${classify(page.url())}`);
console.log(`     العنوان النهائي: ${page.url()}`);
await page.screenshot({ path:'/tmp/shots/b3-after-retry.png' });

console.log(`\nكوكيز الموقع في النهاية: ${await cookieNames()}`);
await b.close(); server.close();
