'use client'
import { useLanguage } from '@lib/context/language-context'

/**
 * شارات وسائل الدفع — أهم عنصر ثقة في صفحة الدفع.
 *
 * ⚠️ اقرأ هذا قبل تعديل أي شكل هنا: **ثلاث من الأربع ليست الشعارات
 * الرسمية**، بل تقريبات مرسومة بيدنا:
 *   · Visa   — كلمة «VISA» بخط Arial، لا الوردمارك الرسمي (خط خاص)
 *   · mada   — مستطيل أخضر وكلمة بخط Arial، لا الشعار الثنائي الرسمي
 *   · Moyasar — دائرة بنفسجية بحرف مرسوم، لا شعار ميسر
 * وحده رمز Mastercard مبنيّ على هندسته الحقيقية (دائرتان متقاطعتان).
 *
 * ⛔ فلا تُلوَّن ولا تُعدَّل أشكالها: علامات تجارية مسجّلة لكل منها دليل
 * استخدام. والصواب استبدالها بملفات SVG الرسمية من كل جهة — وحتى يحدث
 * ذلك، تُعرض كما هي بلا أي تخفيف.
 *
 * ما عولج هنا (كانت باهتة، وهي عنصر الطمأنة قبل إدخال البطاقة):
 *   1. كانت الأقراص على ‎bg-white/5‎ — أي شعارات ملوّنة فوق شبه أسود.
 *      صارت على أبيض صريح، وهو العرف في المتاجر الداكنة.
 *   2. ‎fillOpacity="0.9"‎ على دائرة Mastercard البرتقالية — أُزيل.
 *      ولا يجوز أن يعود: تخفيف لون علامة مخالفة لدليلها.
 *   3. نصوص الشارات كانت ‎text-white/60‎ فوق داكن؛ صارت داكنة على أبيض.
 *
 * 🔍 والحدّة على شاشات Retina مضمونة بالبناء: الأربع **SVG ونص**، أي
 * متجهات تُرسم بدقة الجهاز مهما كانت كثافته. لا صور نقطية هنا، فلا
 * حاجة إلى ‎@2x‎ ولا ‎srcSet‎ — ولا تستبدلها بـ‎PNG‎.
 */

const PILL = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-white/25 shadow-sm'
const LABEL = 'text-[#1A1A1A] text-[11px] font-semibold tracking-wide'

const MoyasarBadge = () => (
  <div className={PILL}>
    <svg width="18" height="18" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill="#7B2FBE" />
      <path d="M9 21V11l7 5 7-5v10" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <span className={LABEL}>Moyasar</span>
  </div>
)

const MadaBadge = () => (
  <div className={PILL}>
    <svg width="26" height="16" viewBox="0 0 52 32" fill="none" role="img" aria-label="mada">
      <rect width="52" height="32" rx="4" fill="#00A551" />
      <text x="26" y="22" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold" fontFamily="Arial, sans-serif">mada</text>
    </svg>
  </div>
)

const VisaBadge = () => (
  <div className={PILL}>
    <span style={{ color: '#1A1F71', fontFamily: 'Arial, sans-serif', fontWeight: 900, fontSize: '13px', letterSpacing: '-0.5px', lineHeight: 1 }}>VISA</span>
  </div>
)

const MastercardBadge = () => (
  <div className={PILL}>
    {/*
      الهندسة الرسمية: دائرتان متقاطعتان، والتقاطع بلون ثالث ‎#FF5F00‎.
      كان التقاطع مرسومًا بمسار تقريبي والبرتقالية مخفّفة إلى 0.9 —
      فصار التقاطع مقصوصًا بالدائرة الحمراء نفسها، أي مطابقًا لا مقارَبًا،
      والعتامة كاملة.
    */}
    <svg width="34" height="20" viewBox="0 0 34 20" fill="none" role="img" aria-label="Mastercard">
      <defs>
        <clipPath id="mc-left"><circle cx="12" cy="10" r="10" /></clipPath>
      </defs>
      <circle cx="12" cy="10" r="10" fill="#EB001B" />
      <circle cx="22" cy="10" r="10" fill="#F79E1B" />
      <circle cx="22" cy="10" r="10" fill="#FF5F00" clipPath="url(#mc-left)" />
    </svg>
    <span className={LABEL}>Mastercard</span>
  </div>
)

export default function PaymentBadges({ compact = false }: { compact?: boolean }) {
  const { lang } = useLanguage()

  return (
    <div dir="ltr" className={`flex flex-wrap items-center gap-2 ${compact ? '' : 'gap-2.5'}`}>
      {!compact && (
        // شارتنا نحن لا علامة غير، فتبقى على الطابع الداكن — ولونها السماوي
        // بعتامة كاملة بعد أن كان ‎/70‎.
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
      <MastercardBadge />
      <VisaBadge />
      <MadaBadge />
      <MoyasarBadge />
    </div>
  )
}
