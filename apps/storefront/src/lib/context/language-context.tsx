'use client'
import { createContext, useContext, useEffect, useState } from 'react'

export type Lang = 'ar' | 'en'

interface LanguageContextValue {
  lang: Lang
  setLang: (l: Lang) => void
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'ar',
  setLang: () => {},
})

function applyLang(l: Lang) {
  document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = l
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ar')

  useEffect(() => {
    const stored = localStorage.getItem('promptr_lang') as Lang | null
    if (stored === 'ar' || stored === 'en') {
      setLangState(stored)
      applyLang(stored)
    }
  }, [])

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem('promptr_lang', l)
    applyLang(l)
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
