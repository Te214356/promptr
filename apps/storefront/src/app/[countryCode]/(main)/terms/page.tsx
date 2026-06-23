'use client'
import { useLanguage } from '@lib/context/language-context'
import LocalizedClientLink from '@modules/common/components/localized-client-link'

const CONTENT = {
  ar: {
    title: 'شروط الاستخدام',
    subtitle: 'Terms of Use',
    back: '← العودة للرئيسية',
    updated: 'آخر تحديث: يونيو 2026',
    intro: 'باستخدامك لمتجر Promptr (promptrsa.com)، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا لم توافق عليها، يُرجى التوقف عن استخدام المتجر.',
    sections: [
      {
        title: '1. تعريفات',
        bullets: [
          '"المتجر" يقصد به منصة Promptr الإلكترونية على promptrsa.com.',
          '"المنتجات الرقمية" تشمل الملفات القابلة للتنزيل، بطاقات الشحن، الاشتراكات، القوالب، والكتب الإلكترونية.',
          '"المستخدم" أو "العميل" هو أي شخص يصل إلى المتجر أو يُجري عملية شراء.',
        ]
      },
      {
        title: '2. أهلية الاستخدام',
        bullets: [
          'يجب أن يكون المستخدم قد أتمّ 18 عاماً، أو يحوز موافقة وليّ أمره القانوني.',
          'يجب أن يكون المستخدم مقيماً في منطقة تُتيح شراء المنتجات الرقمية قانونياً.',
          'يُحظر استخدام المتجر لأغراض تجارية إعادة بيع المنتجات دون إذن مكتوب صريح.',
        ]
      },
      {
        title: '3. المنتجات والأسعار',
        bullets: [
          'جميع الأسعار بالريال السعودي (SAR) وتشمل الضرائب المطبقة.',
          'نحتفظ بالحق في تغيير الأسعار في أي وقت دون إشعار مسبق.',
          'وصف كل منتج ملزم تعاقدياً ويجب أن يطابق ما يستلمه العميل.',
          'صور المنتجات للتوضيح فقط وقد تختلف قليلاً عن النسخة الفعلية.',
        ]
      },
      {
        title: '4. الدفع والفوترة',
        bullets: [
          'تُعالج المدفوعات عبر Moyasar المرخص من مؤسسة النقد العربي السعودي.',
          'وسائل الدفع المقبولة: مدى، فيزا، ماستركارد، والمزيد.',
          'يُعدّ الدفع اكتمالاً للعقد بينك وبين المتجر وقبولاً للشروط.',
          'في حالة رفض البنك للمعاملة، يُعلَّق التسليم حتى اكتمال الدفع.',
        ]
      },
      {
        title: '5. التسليم والوصول',
        bullets: [
          'يُسلَّم المنتج الرقمي فور اكتمال الدفع والتحقق منه، في أغلب الحالات خلال دقائق.',
          'الحد الأقصى للتسليم 24 ساعة. إذا لم تستلم منتجك، تواصل معنا فوراً.',
          'رابط التنزيل/المحتوى يكون صالحاً لعدد محدد من الاستخدامات أو لمدة محددة وفق كل منتج.',
        ]
      },
      {
        title: '6. حقوق الملكية الفكرية والترخيص',
        bullets: [
          'يمنحك الشراء رخصة استخدام شخصية غير حصرية وغير قابلة للتحويل.',
          'لا يحق إعادة بيع أي منتج أو توزيعه أو مشاركته مع آخرين.',
          'لا يحق تعديل المنتج أو استخدامه في أعمال تجارية إلا إذا نُصّ صراحةً على ذلك في وصف المنتج.',
          'الانتهاك يُعرّضك للمطالبة القانونية وفق نظام الملكية الفكرية السعودي.',
        ]
      },
      {
        title: '7. الاستخدام المحظور',
        bullets: [
          'إعادة بيع أو توزيع أي منتج رقمي مشترى من المتجر.',
          'استخدام المتجر لأنشطة احتيالية أو غير قانونية.',
          'محاولة اختراق المنصة أو التلاعب بأنظمة الدفع.',
          'انتحال هوية شخص آخر أو إنشاء حسابات متعددة للتحايل.',
          'نشر محتوى ضار أو مسيء في أي تواصل مع المتجر.',
        ]
      },
      {
        title: '8. تحديد المسؤولية',
        content: 'لن يكون Promptr مسؤولاً عن أي أضرار غير مباشرة أو عرضية أو تبعية ناتجة عن استخدام أو عدم قدرة على استخدام المنتجات. الحد الأقصى لمسؤوليتنا يساوي قيمة المبلغ المدفوع في المعاملة المعنية.'
      },
      {
        title: '9. تعليق الحساب وإنهاؤه',
        content: 'نحتفظ بالحق في تعليق أو إنهاء أي حساب يخالف هذه الشروط، أو يُبدي سلوكاً احتيالياً، أو يُلحق ضرراً بالمتجر أو بعملائه، وذلك دون إشعار مسبق وبأثر فوري.'
      },
      {
        title: '10. القانون الحاكم وتسوية النزاعات',
        content: 'تخضع هذه الشروط لأحكام نظام التجارة الإلكترونية السعودي ونظام حماية المستهلك وسائر الأنظمة السارية في المملكة العربية السعودية. عند أي نزاع، يُسعى أولاً إلى التسوية الودية خلال 15 يوماً. وإذا تعذّر ذلك، تختص المحاكم السعودية المختصة بالنظر فيه.'
      },
      {
        title: '11. تعديل الشروط',
        content: 'نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سينشر التاريخ المحدّث أعلاه عند كل تعديل. استمرارك في استخدام المتجر بعد نشر التعديلات يُعدّ قبولاً لها.'
      },
    ],
  },
  en: {
    title: 'Terms of Use',
    subtitle: 'شروط الاستخدام',
    back: '← Back to Home',
    updated: 'Last updated: June 2026',
    intro: 'By using the Promptr store (promptrsa.com), you agree to be bound by these Terms of Use. If you do not agree, please discontinue using the store.',
    sections: [
      {
        title: '1. Definitions',
        bullets: [
          '"The Store" refers to the Promptr e-commerce platform at promptrsa.com.',
          '"Digital Products" include downloadable files, recharge cards, subscriptions, templates, and e-books.',
          '"User" or "Customer" refers to any person who accesses the store or makes a purchase.',
        ]
      },
      {
        title: '2. Eligibility',
        bullets: [
          'Users must be 18 years of age or have legal guardian consent.',
          'Users must reside in a region where purchasing digital products is legally permitted.',
          'Commercial resale of products without explicit written permission is prohibited.',
        ]
      },
      {
        title: '3. Products & Pricing',
        bullets: [
          'All prices are in Saudi Riyal (SAR) and include applicable taxes.',
          'We reserve the right to change prices at any time without prior notice.',
          'Each product description is contractually binding and must match what the customer receives.',
          'Product images are for illustration purposes only and may differ slightly from the actual version.',
        ]
      },
      {
        title: '4. Payment & Billing',
        bullets: [
          'Payments are processed through Moyasar, licensed by the Saudi Arabian Monetary Authority (SAMA).',
          'Accepted payment methods: Mada, Visa, Mastercard, and more.',
          'Payment constitutes completion of a contract between you and the store and acceptance of these Terms.',
          'If your bank declines the transaction, delivery will be on hold until payment is completed.',
        ]
      },
      {
        title: '5. Delivery & Access',
        bullets: [
          'Digital products are delivered immediately upon payment verification, usually within minutes.',
          'Maximum delivery time is 24 hours. If you have not received your product, contact us immediately.',
          'Download links/content are valid for a limited number of uses or a specific duration per product.',
        ]
      },
      {
        title: '6. Intellectual Property & License',
        bullets: [
          'Your purchase grants you a personal, non-exclusive, non-transferable license to use the product.',
          'Reselling, distributing, or sharing any product with others is strictly prohibited.',
          'Modifying or using products commercially requires explicit mention in the product description.',
          'Violation may result in legal action under Saudi Intellectual Property laws.',
        ]
      },
      {
        title: '7. Prohibited Uses',
        bullets: [
          'Reselling or distributing any digital product purchased from the store.',
          'Using the store for fraudulent or illegal activities.',
          'Attempting to breach the platform or manipulate payment systems.',
          'Impersonating others or creating multiple accounts to circumvent rules.',
          'Publishing harmful or abusive content in any communication with the store.',
        ]
      },
      {
        title: '8. Limitation of Liability',
        content: 'Promptr shall not be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use the products. Our maximum liability shall not exceed the amount paid in the relevant transaction.'
      },
      {
        title: '9. Account Suspension & Termination',
        content: 'We reserve the right to suspend or terminate any account that violates these Terms, exhibits fraudulent behavior, or causes harm to the store or its customers, with immediate effect and without prior notice.'
      },
      {
        title: '10. Governing Law & Dispute Resolution',
        content: 'These Terms are governed by Saudi e-commerce and consumer protection laws. In the event of a dispute, friendly settlement is sought within 15 days. If unsuccessful, competent Saudi courts shall have jurisdiction.'
      },
      {
        title: '11. Amendments',
        content: 'We reserve the right to modify these Terms at any time. The updated date will be published above with each change. Your continued use of the store after changes are published constitutes acceptance.'
      },
    ],
  },
}

export default function TermsPage() {
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
                  <p className="text-white/45 text-sm leading-relaxed">{section.content}</p>
                )}
                {'bullets' in section && (
                  <ul className="space-y-2">
                    {section.bullets!.map((b, j) => (
                      <li key={j} className="flex items-start gap-2 text-white/45 text-sm">
                        <span className="text-[#6C2BFF] mt-1 shrink-0">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-white/5 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6C2BFF" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
              <span className="text-white/20 text-xs">
                {isRTL ? 'خاضعة لأنظمة المملكة العربية السعودية' : 'Subject to Saudi Arabian law'}
              </span>
            </div>
            <LocalizedClientLink href="/refund-policy" className="text-[#00CFFF]/40 hover:text-[#00CFFF]/70 text-xs transition-colors">
              {isRTL ? 'سياسة الاسترجاع ←' : '← Refund Policy'}
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </div>
  )
}
