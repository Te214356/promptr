'use client'
import { LanguageProvider } from '@lib/context/language-context'

export default function CountryCodeLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      {children}
    </LanguageProvider>
  )
}
