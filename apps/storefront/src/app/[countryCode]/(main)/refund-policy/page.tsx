'use client'
import { useLanguage } from '@lib/context/language-context'
import LocalizedClientLink from '@modules/common/components/localized-client-link'

const WA_URL = "https://wa.me/966551859849?text=طلب%20استرداد%20-%20رقم%20الطلب%3A%20"

const CONTENT = {
  ar: {
    title: 'سياسة الاسترجاع والاسترداد',
    subtitle: 'Refund & Return Policy',
    back: '← العودة للرئيسية',
    updated: 'آخر تحديث: يونيو 2026',
    notice: 'نظراً لطبيعة المنتجات الرقمية، فإن الاسترجاع مقيّد. يرجى قراءة هذه السياسة بعناية قبل إتمام الشراء.',
    sections: [
      {
        title: 'المبدأ العام',
        content: 'جميع المنتجات في متجر Promptr منتجات رقمية (ملفات قابلة للتنزيل، اشتراكات، بطاقات شحن، قوالب). بمجرد تسليم المنتج الرقمي أو الإفصاح عن محتواه، لا يمكن إرجاعه أو استرداد قيمته — شأنه شأن أي سلعة رقمية غير قابلة للاسترجاع بطبيعتها.'
      },
      {
        title: 'الحالات المؤهلة للاسترداد',
        bullets: [
          'الملف المُسلَّم تالف أو لا يمكن فتحه أو غير مكتمل.',
          'المنتج المستلَم لا يطابق وصف صفحة المنتج بشكل جوهري.',
          'حدوث خطأ تقني أفضى إلى ازدواجية الدفع على نفس الطلب.',
          'لم يُسلَّم المنتج خلال 24 ساعة من إتمام الدفع دون سبب واضح.',
        ]
      },
      {
        title: 'حالات لا تستوجب الاسترداد',
        bullets: [
          'تغيير رأي المشتري بعد تنزيل أو استخدام المنتج.',
          'عدم الرضا الشخصي عن المحتوى مع مطابقته للوصف.',
          'الشراء بالخطأ بعد الاطلاع على تفاصيل المنتج كاملة.',
          'مشكلات في جهاز المستخدم أو اتصاله بالإنترنت.',
          'مرور أكثر من 7 أيام على تاريخ الشراء.',
        ]
      },
      {
        title: 'آلية طلب الاسترداد',
        steps: [
          'تواصل معنا عبر واتساب خلال 7 أيام من تاريخ الشراء.',
          'أرسل رقم الطلب ووصفاً واضحاً للمشكلة مع لقطة شاشة إن أمكن.',
          'سيُراجَع طلبك خلال 24–48 ساعة عمل.',
          'عند الموافقة، يُردّ المبلغ على نفس وسيلة الدفع خلال 5–10 أيام عمل.',
        ]
      },
      {
        title: 'الإطار القانوني',
        content: 'تخضع هذه السياسة لنظام التجارة الإلكترونية السعودي ولوائحه التنفيذية الصادرة عن وزارة التجارة، وكذلك لنظام حماية المستهلك في المملكة العربية السعودية. في حالة الخلاف، تختص المحاكم السعودية بالنظر في أي نزاع.'
      },
    ],
    waLabel: 'طلب استرداد عبر واتساب',
  },
  en: {
    title: 'Refund & Return Policy',
    subtitle: 'سياسة الاسترجاع والاسترداد',
    back: '← Back to Home',
    updated: 'Last updated: June 2026',
    notice: 'Due to the nature of digital products, refunds are limited. Please read this policy carefully before completing your purchase.',
    sections: [
      {
        title: 'General Principle',
        content: 'All products on Promptr are digital goods (downloadable files, subscriptions, recharge cards, templates). Once a digital product has been delivered or its content disclosed, it cannot be returned or refunded — consistent with the non-returnable nature of digital goods.'
      },
      {
        title: 'Eligible Refund Cases',
        bullets: [
          'The delivered file is corrupted, cannot be opened, or is incomplete.',
          'The received product materially differs from its product page description.',
          'A technical error resulted in a duplicate charge for the same order.',
          'The product was not delivered within 24 hours of successful payment with no apparent reason.',
        ]
      },
      {
        title: 'Non-Refundable Cases',
        bullets: [
          'Change of mind after downloading or using the product.',
          'Personal dissatisfaction when the product matches its description.',
          'Accidental purchase after fully reading product details.',
          'Issues related to the user\'s device or internet connection.',
          'More than 7 days have passed since the purchase date.',
        ]
      },
      {
        title: 'How to Request a Refund',
        steps: [
          'Contact us via WhatsApp within 7 days of your purchase date.',
          'Send your order number, a clear description of the issue, and a screenshot if possible.',
          'Your request will be reviewed within 24–48 business hours.',
          'Upon approval, the amount will be refunded to the original payment method within 5–10 business days.',
        ]
      },
      {
        title: 'Legal Framework',
        content: 'This policy is governed by the Saudi E-Commerce Regulations and their executive rules issued by the Ministry of Commerce, as well as Saudi Consumer Protection laws. In the event of a dispute, Saudi courts shall have jurisdiction.'
      },
    ],
    waLabel: 'Request Refund via WhatsApp',
  },
}

export default function RefundPolicyPage() {
  const { lang } = useLanguage()
  const t = CONTENT[lang]
  const isRTL = lang === 'ar'

  return (
    <div className="bg-[#080810] min-h-screen py-20">
      <div className="content-container max-w-3xl">
        <LocalizedClientLink href="/" className="text-white/30 hover:text-white/60 text-sm mb-8 inline-flex items-center gap-2 transition-colors">
          {t.back}
        </LocalizedClientLink>

        <div className="mt-6 p-8 rounded-2xl border border-white/5 bg-[#0d0d1f]">
          <h1 className="text-3xl font-bold text-white mb-1" dir={isRTL ? 'rtl' : 'ltr'}>{t.title}</h1>
          <p className="text-white/25 text-sm mb-1">{t.subtitle}</p>
          <p className="text-white/15 text-xs mb-8">{t.updated}</p>

          {/* Notice */}
          <div className="flex items-start gap-3 p-4 rounded-xl mb-8" style={{ background: 'rgba(108,43,255,0.07)', border: '1px solid rgba(108,43,255,0.2)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6C2BFF" strokeWidth="2" className="mt-0.5 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-white/55 text-sm leading-relaxed" dir={isRTL ? 'rtl' : 'ltr'}>{t.notice}</p>
          </div>

          <div className="space-y-8" dir={isRTL ? 'rtl' : 'ltr'}>
            {t.sections.map((section, i) => (
              <div key={i}>
                <h2 className="text-white/75 font-semibold text-base mb-3">{section.title}</h2>
                {'content' in section && (
                  <p className="text-white/45 text-sm leading-relaxed">{section.content}</p>
                )}
                {'bullets' in section && (
                  <ul className="space-y-2">
                    {section.bullets!.map((b, j) => (
                      <li key={j} className="flex items-start gap-2 text-white/45 text-sm">
                        <span className="text-[#00CFFF] mt-1 shrink-0">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {'steps' in section && (
                  <ol className="space-y-2">
                    {section.steps!.map((s, j) => (
                      <li key={j} className="flex items-start gap-3 text-white/45 text-sm">
                        <span className="text-[#6C2BFF] font-bold shrink-0 w-5">{j + 1}.</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-white/5 mt-8">
            <a
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-200"
              style={{ background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.25)', color: '#25D366' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.122 1.526 5.855L.057 23.98l6.278-1.647A11.943 11.943 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
              </svg>
              <span className="text-sm font-medium">{t.waLabel}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
