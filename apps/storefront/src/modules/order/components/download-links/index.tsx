"use client"

import { useLanguage } from "@lib/context/language-context"
import { OrderDownload } from "@lib/data/downloads"

export default function DownloadLinks({ downloads }: { downloads: OrderDownload[] }) {
  const { lang } = useLanguage()
  const isAR = lang === "ar"

  if (!downloads.length) return null

  return (
    <div className="flex flex-col gap-4 p-6 bg-[#00CFFF]/5 border border-[#00CFFF]/20 rounded-xl">
      <h2 className="text-xl font-bold text-white">
        {isAR ? "ملفاتك جاهزة للتحميل" : "Your Files Are Ready"}
      </h2>

      <div className="flex flex-col gap-3">
        {downloads.map((d, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-4 flex-wrap py-3 border-b border-white/5 last:border-0"
          >
            <span className="text-white/80 text-sm font-medium flex-1">
              {d.product_title}
            </span>
            <a
              href={d.download_url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6C2BFF] hover:bg-[#5a23d4] text-white text-sm font-bold rounded-lg transition-colors whitespace-nowrap"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {isAR ? "تحميل الملف" : "Download"}
            </a>
          </div>
        ))}
      </div>

      <p className="text-white/40 text-xs">
        {isAR ? "الروابط صالحة لمدة 7 أيام" : "Links are valid for 7 days"}
      </p>
    </div>
  )
}
