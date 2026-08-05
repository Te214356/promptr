'use client'
import { useLanguage } from '@lib/context/language-context'
import LocalizedClientLink from '@modules/common/components/localized-client-link'

const WA_NUMBER = '966551859849'
const WA_URL = `https://wa.me/${WA_NUMBER}`
const WA_DISPLAY = '+966 55 185 9849'
const EMAIL = 'orders@promptrsa.com'
const FREELANCE_DOC = 'FL-390003756'

const CONTENT = {
  ar: {
    title: 'اتصل بنا',
    subtitle: 'Contact Us',
    back: '← العودة للرئيسية',
    intro:
      'قناتان مباشرتان للتواصل مع Promptr. نقرأ كل رسالة، ونرد خلال أيام العمل — وكلما كان سؤالك محددًا (رقم الطلب، اسم المنتج) كان الرد أسرع وأدق.',
    whatsappTitle: 'واتساب',
    whatsappNote: 'الأسرع للاستفسارات قبل الشراء ومتابعة الطلبات.',
    emailTitle: 'البريد الإلكتروني',
    emailNote: 'للاستفسارات التفصيلية، وطلبات الاسترجاع، وأي مراسلة تحتاج مرفقات.',
    scopeTitle: 'نطاق خدمتنا',
    scope: [
      'منتجات رقمية فقط — تُسلَّم عبر رابط تحميل خاص بطلبك فور إتمام الدفع، بلا شحن.',
      'المحتوى بالعربية، مبني للسوق السعودي والخليجي.',
      'المدفوعات بالريال السعودي عبر مزوّد مرخّص من البنك المركزي السعودي.',
      'الدعم يشمل: مشاكل التحميل، أسئلة ما قبل الشراء، وطلبات الاسترجاع وفق السياسة المعلنة.',
    ],
    identityTitle: 'بيانات النشاط',
    identity: [
      { label: 'وثيقة العمل الحر', value: FREELANCE_DOC },
      { label: 'الموقع', value: 'المملكة العربية السعودية' },
      { label: 'المتجر', value: 'promptrsa.com' },
    ],
    policiesTitle: 'قبل أن تراسلنا',
    policiesNote: 'قد تجد إجابتك مباشرة في إحدى هذه الصفحات:',
    policies: [
      { href: '/refund-policy', label: 'سياسة الاسترجاع' },
      { href: '/terms', label: 'شروط الاستخدام' },
      { href: '/privacy-policy', label: 'سياسة الخصوصية' },
      { href: '/about', label: 'من نحن' },
    ],
  },
  en: {
    title: 'Contact Us',
    subtitle: 'اتصل بنا',
    back: '← Back to Home',
    intro:
      'Two direct channels to reach Promptr. We read every message and reply on working days — the more specific your question (order number, product name), the faster and more accurate the answer.',
    whatsappTitle: 'WhatsApp',
    whatsappNote: 'Fastest for pre-purchase questions and order follow-ups.',
    emailTitle: 'Email',
    emailNote: 'For detailed questions, refund requests, and anything needing attachments.',
    scopeTitle: 'Scope of Service',
    scope: [
      'Digital products only — delivered through a download link tied to your order right after payment, no shipping.',
      'Content in Arabic, built for the Saudi and Gulf market.',
      'Payments in SAR through a provider licensed by the Saudi Central Bank.',
      'Support covers: download issues, pre-purchase questions, and refund requests under the published policy.',
    ],
    identityTitle: 'Business Details',
    identity: [
      { label: 'Freelance certificate', value: FREELANCE_DOC },
      { label: 'Location', value: 'Saudi Arabia' },
      { label: 'Store', value: 'promptrsa.com' },
    ],
    policiesTitle: 'Before You Write',
    policiesNote: 'Your answer may already be on one of these pages:',
    policies: [
      { href: '/refund-policy', label: 'Refund Policy' },
      { href: '/terms', label: 'Terms of Use' },
      { href: '/privacy-policy', label: 'Privacy Policy' },
      { href: '/about', label: 'About Us' },
    ],
  },
}

export default function ContactPage() {
  const { lang } = useLanguage()
  const t = CONTENT[lang]
  const isRTL = lang === 'ar'

  return (
    <div className="bg-[#080810] min-h-screen py-20">
      <div className="content-container max-w-3xl">
        <LocalizedClientLink
          href="/"
          className="text-white/30 hover:text-white/60 text-sm mb-8 inline-flex items-center gap-2 transition-colors"
        >
          {t.back}
        </LocalizedClientLink>

        <div className="mt-6 p-8 rounded-2xl border border-white/5 bg-[#0d0d1f]" dir={isRTL ? 'rtl' : 'ltr'}>
          <h1 className="text-3xl font-bold text-white mb-1">{t.title}</h1>
          <p className="text-white/25 text-sm mb-8">{t.subtitle}</p>

          <p className="text-white/50 text-sm leading-relaxed mb-10 pb-8 border-b border-white/5">{t.intro}</p>

          {/* Channels */}
          <div className="grid gap-4 small:grid-cols-2 mb-10">
            <a
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col gap-2 rounded-xl border border-white/10 bg-[#080810] p-5 transition-colors duration-200 hover:border-[#25D366]/40"
            >
              <span className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366" aria-hidden="true">
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.122 1.526 5.855L.057 23.98l6.278-1.647A11.943 11.943 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
                </svg>
                <span className="text-white font-semibold text-sm">{t.whatsappTitle}</span>
              </span>
              <span className="text-[#25D366] text-sm" dir="ltr">
                {WA_DISPLAY}
              </span>
              <span className="text-white/40 text-xs leading-relaxed">{t.whatsappNote}</span>
            </a>

            <a
              href={`mailto:${EMAIL}`}
              className="flex flex-col gap-2 rounded-xl border border-white/10 bg-[#080810] p-5 transition-colors duration-200 hover:border-[#6C2BFF]/40"
            >
              <span className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00CFFF" strokeWidth="1.8" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 7l9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-white font-semibold text-sm">{t.emailTitle}</span>
              </span>
              <span className="text-[#00CFFF] text-sm" dir="ltr">
                {EMAIL}
              </span>
              <span className="text-white/40 text-xs leading-relaxed">{t.emailNote}</span>
            </a>
          </div>

          {/* Scope */}
          <div className="mb-10">
            <h2 className="text-white/75 font-semibold text-base mb-3">{t.scopeTitle}</h2>
            <ul className="space-y-2">
              {t.scope.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-white/45 text-sm">
                  <span className="text-[#00CFFF] mt-1 shrink-0">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Business details */}
          <div className="mb-10">
            <h2 className="text-white/75 font-semibold text-base mb-3">{t.identityTitle}</h2>
            <dl className="space-y-2">
              {t.identity.map((row, i) => (
                <div key={i} className="flex flex-wrap items-baseline gap-x-3 text-sm">
                  <dt className="text-white/35">{row.label}</dt>
                  <dd className="text-white/60 font-mono text-xs">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Policies */}
          <div className="pt-6 border-t border-white/5">
            <h2 className="text-white/75 font-semibold text-base mb-2">{t.policiesTitle}</h2>
            <p className="text-white/40 text-sm mb-4">{t.policiesNote}</p>
            <div className="flex flex-wrap gap-2">
              {t.policies.map((p) => (
                <LocalizedClientLink
                  key={p.href}
                  href={p.href}
                  className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/60 transition-colors duration-200 hover:border-[#6C2BFF]/50 hover:text-white"
                >
                  {p.label}
                </LocalizedClientLink>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
