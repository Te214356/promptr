import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "سياسة الاسترجاع | Promptr",
  description: "سياسة الاسترجاع والاسترداد لمتجر Promptr الرقمي",
}

export default function ReturnPolicyPage() {
  return (
    <div className="bg-[#080810] min-h-screen py-20">
      <div className="content-container max-w-3xl">
        <LocalizedClientLink href="/" className="text-white/30 hover:text-white/60 text-sm mb-8 inline-flex items-center gap-2 transition-colors">
          ← العودة للرئيسية
        </LocalizedClientLink>

        <div className="mt-6 p-8 rounded-2xl border border-white/5 bg-[#0d0d1f]">
          <h1 className="text-3xl font-bold text-white mb-2" dir="rtl" lang="ar">سياسة الاسترجاع والاسترداد</h1>
          <p className="text-white/30 text-sm mb-8">Return & Refund Policy</p>

          <div className="space-y-6 text-white/50 text-sm leading-relaxed" dir="rtl" lang="ar">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-[#6C2BFF]/8 border border-[#6C2BFF]/20">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6C2BFF" strokeWidth="2" className="mt-0.5 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-white/60">
                نظراً لطبيعة المنتجات الرقمية، فإن عمليات الاسترجاع محدودة. يرجى قراءة السياسة بعناية.
              </p>
            </div>

            <h2 className="text-white/70 font-semibold text-base">حالات الاسترداد المقبولة</h2>
            <ul className="space-y-2 pr-4">
              <li className="flex items-start gap-2">
                <span className="text-[#00CFFF] mt-1">•</span>
                <span>المنتج لا يعمل أو لا يتطابق مع وصفه المذكور في صفحة المنتج.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#00CFFF] mt-1">•</span>
                <span>تم الاستلام بملف تالف أو غير مكتمل.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#00CFFF] mt-1">•</span>
                <span>حدوث خطأ تقني في عملية الدفع أدى إلى ازدواجية في الشراء.</span>
              </li>
            </ul>

            <h2 className="text-white/70 font-semibold text-base">إجراءات طلب الاسترداد</h2>
            <p>
              تواصل معنا خلال 7 أيام من تاريخ الشراء عبر واتساب مع ذكر رقم الطلب وسبب الطلب. سيتم الرد خلال 24 ساعة.
            </p>

            <h2 className="text-white/70 font-semibold text-base">مدة الاسترداد</h2>
            <p>
              بعد الموافقة على طلب الاسترداد، يتم ردّ المبلغ خلال 5-10 أيام عمل على نفس وسيلة الدفع الأصلية.
            </p>

            <div className="pt-4 border-t border-white/5">
              <a
                href="https://wa.me/966500000000?text=أريد الاستفسار عن سياسة الاسترجاع"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] text-sm font-medium transition-all duration-200"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.122 1.526 5.855L.057 23.98l6.278-1.647A11.943 11.943 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
                </svg>
                تواصل معنا عبر واتساب
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
