'use client'
import { useLanguage } from '@lib/context/language-context'
import LocalizedClientLink from '@modules/common/components/localized-client-link'

export default function NavAccountLink() {
  const { lang } = useLanguage()
  return (
    <LocalizedClientLink
      className="text-white/60 hover:text-white text-sm transition-colors duration-200"
      href="/account"
      data-testid="nav-account-link"
    >
      {lang === 'ar' ? 'الحساب' : 'Account'}
    </LocalizedClientLink>
  )
}
