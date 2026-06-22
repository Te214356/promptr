import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "سياسة الخصوصية | Promptr",
  description: "سياسة الخصوصية لمتجر Promptr الرقمي",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-[#080810] min-h-screen py-20">
      <div className="content-container max-w-3xl">
        <LocalizedClientLink href="/" className="text-white/30 hover:text-white/60 text-sm mb-8 inline-flex items-center gap-2 transition-colors">
          ← العودة للرئيسية
        </LocalizedClientLink>

        <div className="mt-6 p-8 rounded-2xl border border-white/5 bg-[#0d0d1f]">
          <h1 className="text-3xl font-bold text-white mb-2" dir="rtl" lang="ar">سياسة الخصوصية</h1>
          <p className="text-white/30 text-sm mb-8">Privacy Policy</p>

          <div className="space-y-6 text-white/50 text-sm leading-relaxed" dir="rtl" lang="ar">
            <p>
              نحن في Promptr نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية. تصف هذه السياسة كيفية جمع معلوماتك واستخدامها وحمايتها عند استخدامك لمتجرنا الرقمي.
            </p>
            <h2 className="text-white/70 font-semibold text-base">المعلومات التي نجمعها</h2>
            <p>
              نجمع المعلومات التي تقدمها عند إنشاء حساب أو إتمام عملية شراء، بما في ذلك الاسم والبريد الإلكتروني وتفاصيل الدفع.
            </p>
            <h2 className="text-white/70 font-semibold text-base">كيف نستخدم معلوماتك</h2>
            <p>
              نستخدم بياناتك لمعالجة طلباتك وتحسين تجربتك في المتجر وإرسال التحديثات المتعلقة بطلباتك.
            </p>
            <h2 className="text-white/70 font-semibold text-base">أمان البيانات</h2>
            <p>
              جميع المعاملات مشفرة بتقنية SSL. نستخدم Moyasar كمعالج دفع موثوق ومرخص في المملكة العربية السعودية.
            </p>
            <p className="text-white/20 text-xs pt-4 border-t border-white/5">
              سيتم تحديث هذه السياسة قريباً. للاستفسار: تواصل معنا عبر{" "}
              <a href="https://wa.me/966500000000" className="text-[#25D366]/60 hover:text-[#25D366]">واتساب</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
