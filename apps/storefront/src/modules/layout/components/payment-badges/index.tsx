'use client'
import { useLanguage } from '@lib/context/language-context'

/**
 * شارات وسائل الدفع — آخر ما ينظر إليه المشتري قبل إدخال بطاقته.
 *
 * الأربعة الآن **الشعارات الرسمية** تُقدَّم كملفات من `public/images/payment/`،
 * بعد أن كانت أشكالًا مرسومة بأيدينا (كلمة VISA بخط Arial، ومستطيل أخضر
 * مكتوب عليه mada، ودائرة بنفسجية لميسر) — أي تقريبات لعلامات مسجّلة.
 *
 * | العلامة    | المصدر                                   | الصيغة |
 * |------------|------------------------------------------|--------|
 * | Visa       | مجموعة `logos` في Iconify                | SVG    |
 * | Mastercard | مجموعة `logos` في Iconify                | SVG    |
 * | mada       | ويكيميديا كومنز — «شعار شبكة المدفوعات السعودية»، ملك عام | SVG |
 * | Moyasar    | `moyasar.com/logo.png` — موقع ميسر نفسه  | PNG    |
 *
 * ⛔ **لا تُعدَّل الملفات ولا ألوانها ولا نسبها.** تُعرض كما وردت من مصدرها،
 * والمقاسات أدناه تحفظ نسبة كل شعار من `viewBox` الأصلي:
 *   visa 256×83 · mastercard 256×199 · mada 796.2×265.5 · moyasar 1500×191
 * أي تغيير في الارتفاع يقتضي إعادة حساب العرض من نفس النسبة.
 *
 * ⚠️ **وميسر لا تنشر SVG:** جُرّب `moyasar.com/logo.svg` فردّ 404، وموقعها
 * يستعمل PNG. والأصل هنا 1500×191 يُعرض بعرض 88px — أي تصغير 17×، فهو
 * حادّ على Retina وما بعدها. **لا تستبدله بنسخة أصغر**، ولو ظهرت SVG رسمية
 * لاحقًا فهي الأولى.
 *
 * ولا نكتب اسم العلامة بخطّنا بجانب شعارها: الشعارات الأربعة **وردمارك**
 * تحمل الاسم أصلًا، وإضافة نصّ ثانٍ تكرار وخروج عن دليل الاستخدام.
 */

const PILL = 'flex items-center px-3 py-1.5 rounded-lg bg-white border border-white/25 shadow-sm'

/**
 * ‎w‎/‎h‎ هما الأبعاد **الأصلية** للملف لا أبعاد العرض: المتصفح يشتق منهما
 * نسبة الصورة فيحجز مكانها قبل التحميل (بلا قفزة تخطيط). والعرض الفعلي
 * يأتي من ‎height‎ في CSS مع ‎width:auto‎، فتُرسم كل علامة بنسبتها بالضبط
 * ولا تنضغط ولو غُيّر الارتفاع.
 */
const MARKS = [
  { src: '/images/payment/mastercard.svg', alt: 'Mastercard', w: 256, h: 199, display: 21 },
  { src: '/images/payment/visa.svg', alt: 'Visa', w: 256, h: 83, display: 15 },
  { src: '/images/payment/mada.svg', alt: 'mada', w: 796, h: 266, display: 17 },
  { src: '/images/payment/moyasar.png', alt: 'Moyasar', w: 1500, h: 191, display: 11 },
]

export default function PaymentBadges({ compact = false }: { compact?: boolean }) {
  const { lang } = useLanguage()

  return (
    <div dir="ltr" className={`flex flex-wrap items-center gap-2 ${compact ? '' : 'gap-2.5'}`}>
      {!compact && (
        // شارتنا نحن لا علامة غير، فتبقى على الطابع الداكن.
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/40">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00CFFF" strokeWidth="2" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span className="text-[#00CFFF] text-[11px] font-medium">
            {lang === 'ar' ? 'مؤمّن SSL' : 'SSL Secured'}
          </span>
        </div>
      )}

      {MARKS.map((m) => (
        <div key={m.alt} className={PILL}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={m.src} alt={m.alt} width={m.w} height={m.h} style={{ height: m.display, width: 'auto' }} loading="lazy" decoding="async" />
        </div>
      ))}
    </div>
  )
}
