import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import "styles/globals.css"
import { LanguageProvider } from "@lib/context/language-context"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" data-mode="dark">
      <body className="bg-[#080810] text-white">
        <LanguageProvider>
          <main className="relative">{props.children}</main>
        </LanguageProvider>
      </body>
    </html>
  )
}
