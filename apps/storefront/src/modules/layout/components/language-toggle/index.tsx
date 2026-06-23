'use client'
import { useLanguage } from '@lib/context/language-context'

export default function LanguageToggle() {
  const { lang, setLang } = useLanguage()

  return (
    <button
      onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
      aria-label="تبديل اللغة / Switch language"
      className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-white/10 hover:border-[#6C2BFF]/50 bg-white/[0.04] hover:bg-[#6C2BFF]/10 transition-all duration-200"
    >
      <span className={`text-[11px] font-bold tracking-wide transition-colors duration-200 ${lang === 'ar' ? 'text-[#6C2BFF]' : 'text-white/30'}`}>
        AR
      </span>
      <span className="text-white/15 text-[10px] select-none">/</span>
      <span className={`text-[11px] font-bold tracking-wide transition-colors duration-200 ${lang === 'en' ? 'text-[#00CFFF]' : 'text-white/30'}`}>
        EN
      </span>
    </button>
  )
}
