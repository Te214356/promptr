'use client'
import { useLanguage } from '@lib/context/language-context'
import LocalizedClientLink from '@modules/common/components/localized-client-link'

const CONTENT = {
  ar: {
    title: 'سياسة الخصوصية',
    subtitle: 'Privacy Policy',
    back: '← العودة للرئيسية',
    updated: 'آخر تحديث: يونيو 2026',
    intro: 'نحن في Promptr نلتزم بحماية خصوصيتك وفقاً لنظام حماية البيانات الشخصية في المملكة العربية السعودية (PDPL). توضح هذه السياسة كيفية جمع بياناتك، استخدامها، وحمايتها.',
    sections: [
      {
        title: 'أولاً: البيانات التي نجمعها',
        bullets: [
          'بيانات الحساب: الاسم الكامل، البريد الإلكتروني، رقم الجوال.',
          'بيانات الطلبات: تفاصيل المنتجات المشتراة، تاريخ ومبلغ كل معاملة.',
          'بيانات الدفع: تُعالج حصرياً من قِبل Moyasar (مرخص من البنك المركزي السعودي (ساما)) ولا نحتفظ ببيانات البطاقات.',
          'بيانات الاستخدام: عنوان IP، نوع المتصفح، الصفحات التي زرتها، مدة الجلسة.',
          'ملفات الارتباط (Cookies): لتحسين تجربتك وحفظ إعداداتك.',
        ]
      },
      {
        title: 'ثانياً: الغرض من جمع البيانات',
        bullets: [
          'معالجة طلباتك وتسليم المنتجات الرقمية.',
          'إدارة حسابك وتقديم خدمة العملاء.',
          'إرسال تأكيدات الطلبات والإيصالات عبر البريد الإلكتروني.',
          'تحسين خدماتنا وأداء المتجر.',
          'الامتثال للمتطلبات القانونية والتنظيمية.',
        ]
      },
      {
        title: 'ثالثاً: مشاركة البيانات مع الأطراف الثالثة',
        content: 'لا نبيع بياناتك ولا نشاركها لأغراض تجارية. نشارك البيانات فقط مع:',
        bullets: [
          'Moyasar: لمعالجة المدفوعات بأمان.',
          'Railway: لاستضافة المتجر وتشغيله.',
          'الجهات الحكومية: عند الطلب القانوني من جهة مختصة.',
        ]
      },
      {
        title: 'رابعاً: حقوق المستخدم (وفق نظام PDPL)',
        bullets: [
          'حق الاطلاع: طلب نسخة من بياناتك المحفوظة لدينا.',
          'حق التصحيح: تعديل أي بيانات غير دقيقة.',
          'حق الحذف: طلب مسح بياناتك (مع استثناءات الالتزامات القانونية).',
          'حق الاعتراض: رفض معالجة بياناتك لأغراض التسويق.',
          'حق نقل البيانات: استلام بياناتك بصيغة قابلة للقراءة.',
        ]
      },
      {
        title: 'خامساً: أمان البيانات',
        content: 'نستخدم بروتوكول HTTPS (TLS) لتشفير جميع الاتصالات. تُعالج بيانات الدفع من خلال Moyasar المرخص والمتوافق مع معيار PCI-DSS. يقتصر الوصول إلى البيانات الحساسة على الموظفين المخولين.'
      },
      {
        title: 'سادساً: مدة الاحتفاظ بالبيانات',
        content: 'نحتفظ ببياناتك طالما حسابك نشط، وبعد إغلاقه لمدة 3 سنوات استيفاءً للمتطلبات القانونية والمحاسبية. يمكنك طلب الحذف المبكر مع مراعاة الالتزامات القانونية.'
      },
      {
        title: 'سابعاً: ملفات الارتباط (Cookies)',
        content: 'نستخدم cookies ضرورية لتشغيل الموقع (مثل جلسة تسجيل الدخول وسلة التسوق) وأخرى تحليلية لفهم سلوك المستخدمين. يمكنك تعطيل الـ cookies من إعدادات متصفحك مع العلم بأن ذلك قد يؤثر على بعض وظائف الموقع.'
      },
      {
        title: 'ثامناً: التعديلات على السياسة',
        content: 'نحتفظ بالحق في تعديل هذه السياسة في أي وقت. سيُخطَر المستخدمون المسجلون بالتغييرات الجوهرية عبر البريد الإلكتروني. الاستمرار في استخدام المتجر بعد نشر التعديلات يعني قبولها.'
      },
      {
        title: 'تواصل معنا',
        content: 'لممارسة حقوقك أو الاستفسار عن سياسة الخصوصية، تواصل معنا عبر واتساب: +966 55 185 9849 أو عبر البريد الإلكتروني.'
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    subtitle: 'سياسة الخصوصية',
    back: '← Back to Home',
    updated: 'Last updated: June 2026',
    intro: 'At Promptr, we are committed to protecting your privacy in accordance with Saudi Arabia\'s Personal Data Protection Law (PDPL). This policy explains how we collect, use, and protect your data.',
    sections: [
      {
        title: '1. Data We Collect',
        bullets: [
          'Account data: Full name, email address, phone number.',
          'Order data: Details of purchased products, date and amount of each transaction.',
          'Payment data: Processed exclusively by Moyasar (licensed by SAMA). We do not store card details.',
          'Usage data: IP address, browser type, pages visited, session duration.',
          'Cookies: To enhance your experience and save your preferences.',
        ]
      },
      {
        title: '2. Purpose of Data Collection',
        bullets: [
          'Processing your orders and delivering digital products.',
          'Managing your account and providing customer support.',
          'Sending order confirmations and receipts via email.',
          'Improving our services and store performance.',
          'Complying with legal and regulatory requirements.',
        ]
      },
      {
        title: '3. Third-Party Data Sharing',
        content: 'We do not sell your data or share it for commercial purposes. We only share data with:',
        bullets: [
          'Moyasar: For secure payment processing.',
          'Railway: For hosting and operating the store.',
          'Government authorities: Upon lawful request from a competent authority.',
        ]
      },
      {
        title: '4. Your Rights Under PDPL',
        bullets: [
          'Right to access: Request a copy of your data held by us.',
          'Right to rectification: Correct any inaccurate data.',
          'Right to erasure: Request deletion of your data (subject to legal retention obligations).',
          'Right to object: Refuse processing of your data for marketing purposes.',
          'Right to data portability: Receive your data in a readable format.',
        ]
      },
      {
        title: '5. Data Security',
        content: 'We use HTTPS (TLS) to encrypt all communications. Payment data is processed through Moyasar, which is PCI-DSS compliant and licensed by SAMA. Access to sensitive data is restricted to authorized personnel only.'
      },
      {
        title: '6. Data Retention',
        content: 'We retain your data for as long as your account is active, and for 3 years after closure to fulfill legal and accounting requirements. You may request early deletion subject to legal obligations.'
      },
      {
        title: '7. Cookies',
        content: 'We use essential cookies for site operation (login sessions, shopping cart) and analytical cookies to understand user behavior. You can disable cookies in your browser settings, though this may affect some site functions.'
      },
      {
        title: '8. Policy Updates',
        content: 'We reserve the right to update this policy at any time. Registered users will be notified of material changes via email. Continued use of the store after changes are published constitutes acceptance.'
      },
      {
        title: 'Contact Us',
        content: 'To exercise your rights or inquire about this privacy policy, contact us via WhatsApp: +966 55 185 9849 or via email.'
      },
    ],
  },
}

export default function PrivacyPolicyPage() {
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

          <p className="text-white/50 text-sm leading-relaxed mb-10 pb-8 border-b border-white/5" dir={isRTL ? 'rtl' : 'ltr'}>
            {t.intro}
          </p>

          <div className="space-y-8" dir={isRTL ? 'rtl' : 'ltr'}>
            {t.sections.map((section, i) => (
              <div key={i}>
                <h2 className="text-white/75 font-semibold text-base mb-3">{section.title}</h2>
                {'content' in section && (
                  <p className="text-white/45 text-sm leading-relaxed mb-2">{section.content}</p>
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
              </div>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-white/5 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6C2BFF" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="text-white/20 text-xs">
              {isRTL ? 'متوافقة مع نظام حماية البيانات الشخصية السعودي (PDPL)' : 'Compliant with Saudi Personal Data Protection Law (PDPL)'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
