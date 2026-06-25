'use client'
import { useLanguage } from '@lib/context/language-context'

const MoyasarBadge = () => (
  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
    <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#7B2FBE" />
      <path d="M9 21V11l7 5 7-5v10" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <span className="text-white/70 text-[11px] font-semibold tracking-wide">Moyasar</span>
  </div>
)

const MadaBadge = () => (
  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
    <svg width="26" height="16" viewBox="0 0 52 32" fill="none">
      <rect width="52" height="32" rx="4" fill="#00A551" />
      <text x="26" y="22" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold" fontFamily="Arial, sans-serif">mada</text>
    </svg>
  </div>
)

const VisaBadge = () => (
  <div className="flex items-center px-3 py-1.5 rounded-lg bg-white border border-white/20">
    <span style={{ color: '#1A1F71', fontFamily: 'Arial, sans-serif', fontWeight: 900, fontSize: '13px', letterSpacing: '-0.5px', lineHeight: 1 }}>VISA</span>
  </div>
)

const MastercardBadge = () => (
  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
    <svg width="34" height="20" viewBox="0 0 34 20" fill="none">
      <circle cx="12" cy="10" r="10" fill="#EB001B" />
      <circle cx="22" cy="10" r="10" fill="#F79E1B" fillOpacity="0.9" />
      <path d="M17 3.8a10 10 0 0 1 0 12.4A10 10 0 0 1 17 3.8z" fill="#FF5F00" />
    </svg>
    <span className="text-white/60 text-[10px] font-medium">Mastercard</span>
  </div>
)

export default function PaymentBadges({ compact = false }: { compact?: boolean }) {
  const { lang } = useLanguage()

  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? '' : 'gap-2.5'}`}>
      <MoyasarBadge />
      <MadaBadge />
      <VisaBadge />
      <MastercardBadge />
      {!compact && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00CFFF" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span className="text-[#00CFFF]/70 text-[11px] font-medium">
            {lang === 'ar' ? 'مؤمّن SSL' : 'SSL Secured'}
          </span>
        </div>
      )}
    </div>
  )
}
