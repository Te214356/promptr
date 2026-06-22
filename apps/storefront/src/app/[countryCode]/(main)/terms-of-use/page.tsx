import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "شروط الاستخدام | Promptr",
  description: "شروط الاستخدام لمتجر Promptr الرقمي",
}

export default function TermsOfUsePage() {
  return (
    <div className="bg-[#080810] min-h-screen py-20">
      <div className="content-container max-w-3xl">
        <LocalizedClientLink href="/" className="text-white/30 hover:text-white/60 text-sm mb-8 inline-flex items-center gap-2 transition-colors">
          ← العودة للرئيسية
        </LocalizedClientLink>

        <div className="mt-6 p-8 rounded-2xl border border-white/5 bg-[#0d0d1f]">
          <h1 className="text-3xl font-bold text-white mb-2" dir="rtl" lang="ar">شروط الاستخدام</h1>
          <p className="text-white/30 text-sm mb-8">Terms of Use</p>

          <div className="space-y-6 text-white/50 text-sm leading-relaxed" dir="rtl" lang="ar">
            <p>
              باستخدامك لمتجر Promptr فإنك توافق على الالتزام بهذه الشروط والأحكام. يرجى قراءتها بعناية قبل إتمام أي عملية شراء.
            </p>
            <h2 className="text-white/70 font-semibold text-base">المنتجات الرقمية</h2>
            <p>
              جميع المنتجات في متجرنا رقمية وتسليمها فوري عبر البريد الإلكتروني بعد تأكيد الدفع. لا يتم شحن منتجات مادية.
            </p>
            <h2 className="text-white/70 font-semibold text-base">حقوق الملكية الفكرية</h2>
            <p>
              المنتجات المشتراة مرخصة للاستخدام الشخصي فقط ما لم يُذكر خلاف ذلك. لا يُسمح بإعادة البيع أو التوزيع.
            </p>
            <h2 className="text-white/70 font-semibold text-base">المسؤولية</h2>
            <p>
              Promptr غير مسؤول عن أي أضرار ناتجة عن سوء استخدام المنتجات. جميع المبيعات خاضعة لنظام التجارة الإلكترونية السعودي.
            </p>
            <p className="text-white/20 text-xs pt-4 border-t border-white/5">
              سيتم تحديث هذه الشروط قريباً. للاستفسار:{" "}
              <a href="https://wa.me/966500000000" className="text-[#25D366]/60 hover:text-[#25D366]">تواصل معنا</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
