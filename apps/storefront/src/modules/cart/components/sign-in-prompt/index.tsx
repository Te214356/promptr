"use client"

import { Button } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useLanguage } from "@lib/context/language-context"

const SignInPrompt = () => {
  const { lang } = useLanguage()
  const isAR = lang === "ar"

  return (
    <div className="bg-[#0d0d1f] border border-white/10 rounded-2xl p-5 flex items-center justify-between">
      <div>
        <h2 className="text-base font-semibold text-white">
          {isAR ? "لديك حساب بالفعل؟" : "Already have an account?"}
        </h2>
        <p className="text-sm text-white/50 mt-1">
          {isAR ? "سجّل دخولك لتجربة أفضل." : "Sign in for a better experience."}
        </p>
      </div>
      <LocalizedClientLink href="/account">
        <Button variant="secondary" className="h-10" data-testid="sign-in-button">
          {isAR ? "تسجيل الدخول" : "Sign in"}
        </Button>
      </LocalizedClientLink>
    </div>
  )
}

export default SignInPrompt
