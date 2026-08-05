'use client'
import { useLanguage } from '@lib/context/language-context'
import LocalizedClientLink from '@modules/common/components/localized-client-link'

const CONTENT = {
  ar: {
    title: 'من نحن',
    subtitle: 'About Promptr',
    back: '← العودة للرئيسية',
    intro:
      'Promptr متجر رقمي سعودي يبني أدوات ومحتوى جاهزًا للاستخدام باللغة العربية — لأصحاب المتاجر والمشاريع الصغيرة ومن يعمل لحسابه.',
    sections: [
      {
        title: 'ماذا نقدّم',
        content: 'منتجات رقمية تُسلَّم فور إتمام الطلب، بلا شحن ولا انتظار:',
        bullets: [
          'حزم برومبتات جاهزة بالعربية — تجارة إلكترونية، خدمة عملاء، محتوى تسويقي، وصور.',
          'أدلة عملية مبنية للسوق السعودي تحديدًا: إنشاء متجر إلكتروني، أساسيات الذكاء الاصطناعي، السيرة الذاتية لحديثي التخرج.',
          'قوالب جاهزة للنسخ: منشورات السوشيال ميديا، سكربتات الفيديو القصير، ونماذج التواصل مع العملاء.',
          'مدونة مفتوحة للجميع، فيها مقالات عملية كاملة بلا اشتراك ولا تسجيل.',
        ],
      },
      {
        title: 'لماذا بدأنا',
        content:
          'أغلب المحتوى المتاح عن الذكاء الاصطناعي والتجارة الإلكترونية مكتوب لسوق آخر ثم يُترجم حرفيًا — فتصل النصيحة بلا سياقها: أنظمة لا تنطبق، أمثلة لا تشبه السوق، ولغة تبدو مترجمة. نحن نبني المحتوى عربيًا من أساسه، ونذكر الجهات الرسمية السعودية بأسمائها حين يتعلق الأمر بالأنظمة.',
      },
      {
        title: 'كيف نكتب',
        bullets: [
          'قيمة كاملة بلا بتر: ما ننشره في المدونة يقف بذاته ولا يحجب خطوة ليدفعك للشراء.',
          'لا أرقام متغيرة: الرسوم والحدود النظامية تتغيّر، فنحيلك للمصدر الرسمي بدل رقم يتقادم.',
          'أمثلة قابلة للنسخ: قوالب ونصوص جاهزة للتعديل، لا نصائح عامة.',
        ],
      },
      {
        title: 'الشفافية',
        content:
          'نشاط موثّق بوثيقة عمل حر برقم FL-390003756، والمدفوعات تُعالَج عبر مزود مرخّص من البنك المركزي السعودي، والمنتجات تصل عبر رابط تحميل خاص بطلبك بعد الدفع مباشرة.',
      },
    ],
    ctaTitle: 'ابدأ من هنا',
    ctaStore: 'تصفّح المتجر',
    ctaBlog: 'اقرأ المدونة',
    ctaContact: 'تواصل معنا',
  },
  en: {
    title: 'About Us',
    subtitle: 'من نحن',
    back: '← Back to Home',
    intro:
      'Promptr is a Saudi digital store building ready-to-use Arabic tools and content for store owners, small businesses, and freelancers.',
    sections: [
      {
        title: 'What We Offer',
        content: 'Digital products delivered the moment your order is complete — no shipping, no waiting:',
        bullets: [
          'Arabic prompt packs — e-commerce, customer service, marketing content, and images.',
          'Practical guides built for the Saudi market: launching an online store, AI fundamentals, CVs for new graduates.',
          'Copy-ready templates: social media posts, short-video scripts, and customer message templates.',
          'An open blog with complete, practical articles — no subscription, no sign-up.',
        ],
      },
      {
        title: 'Why We Started',
        content:
          'Most available material on AI and e-commerce is written for another market then translated literally, so the advice arrives without its context: regulations that do not apply, examples that do not match the market, and language that reads like a translation. We write in Arabic from the ground up, and name the actual Saudi authorities whenever regulations are involved.',
      },
      {
        title: 'How We Write',
        bullets: [
          'Complete value: what we publish stands on its own and never withholds a step to push a sale.',
          'No volatile numbers: fees and regulatory thresholds change, so we point you to the official source instead of a figure that ages.',
          'Copy-ready examples: templates and text you can edit, not general advice.',
        ],
      },
      {
        title: 'Transparency',
        content:
          'The business is documented under Saudi freelance certificate FL-390003756, payments are processed by a provider licensed by the Saudi Central Bank, and products arrive through a download link tied to your order immediately after payment.',
      },
    ],
    ctaTitle: 'Start Here',
    ctaStore: 'Browse the store',
    ctaBlog: 'Read the blog',
    ctaContact: 'Contact us',
  },
}

export default function AboutPage() {
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

        <div className="mt-6 p-8 rounded-2xl border border-white/5 bg-[#0d0d1f]">
          <h1 className="text-3xl font-bold text-white mb-1" dir={isRTL ? 'rtl' : 'ltr'}>
            {t.title}
          </h1>
          <p className="text-white/25 text-sm mb-8">{t.subtitle}</p>

          <p
            className="text-white/50 text-sm leading-relaxed mb-10 pb-8 border-b border-white/5"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
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

          <div className="mt-10 pt-6 border-t border-white/5" dir={isRTL ? 'rtl' : 'ltr'}>
            <h2 className="text-white/75 font-semibold text-base mb-4">{t.ctaTitle}</h2>
            <div className="flex flex-wrap gap-3">
              <LocalizedClientLink
                href="/store"
                className="rounded-full bg-[#6C2BFF] px-6 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-[#5a22dd]"
              >
                {t.ctaStore}
              </LocalizedClientLink>
              <LocalizedClientLink
                href="/blog"
                className="rounded-full border border-white/15 px-6 py-2.5 text-sm font-medium text-white/80 transition-all duration-200 hover:border-[#6C2BFF]/70 hover:text-white"
              >
                {t.ctaBlog}
              </LocalizedClientLink>
              <LocalizedClientLink
                href="/contact"
                className="rounded-full border border-white/15 px-6 py-2.5 text-sm font-medium text-white/80 transition-all duration-200 hover:border-[#6C2BFF]/70 hover:text-white"
              >
                {t.ctaContact}
              </LocalizedClientLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
