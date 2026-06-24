"use client"

import { useActionState } from "react"
import Input from "@modules/common/components/input"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { signup } from "@lib/data/customer"
import { useLanguage } from "@lib/context/language-context"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Register = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(signup, null)
  const { lang } = useLanguage()
  const isAR = lang === "ar"

  return (
    <div
      className="max-w-sm flex flex-col items-center"
      data-testid="register-page"
      dir={isAR ? "rtl" : "ltr"}
    >
      <h1 className="text-large-semi uppercase mb-6">
        {isAR ? "أنشئ حسابك في Promptr" : "Become a Promptr Member"}
      </h1>
      <p className="text-center text-base-regular text-ui-fg-base mb-4">
        {isAR
          ? "أنشئ ملفك الشخصي واستمتع بتجربة تسوق متميزة."
          : "Create your Promptr Member profile, and get access to an enhanced shopping experience."}
      </p>
      <form className="w-full flex flex-col" action={formAction}>
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label={isAR ? "الاسم الأول" : "First name"}
            name="first_name"
            required
            autoComplete="given-name"
            data-testid="first-name-input"
          />
          <Input
            label={isAR ? "اسم العائلة" : "Last name"}
            name="last_name"
            required
            autoComplete="family-name"
            data-testid="last-name-input"
          />
          <Input
            label={isAR ? "البريد الإلكتروني" : "Email"}
            name="email"
            required
            type="email"
            autoComplete="email"
            data-testid="email-input"
          />
          <Input
            label={isAR ? "رقم الجوال" : "Phone"}
            name="phone"
            type="tel"
            autoComplete="tel"
            data-testid="phone-input"
          />
          <Input
            label={isAR ? "كلمة المرور" : "Password"}
            name="password"
            required
            type="password"
            autoComplete="new-password"
            data-testid="password-input"
          />
        </div>
        <ErrorMessage error={message} data-testid="register-error" />
        <span className="text-center text-ui-fg-base text-small-regular mt-6">
          {isAR ? (
            <>
              بإنشاء حساب، أنت توافق على{" "}
              <LocalizedClientLink href="/privacy-policy" className="underline">
                سياسة الخصوصية
              </LocalizedClientLink>{" "}
              و{" "}
              <LocalizedClientLink href="/terms" className="underline">
                شروط الاستخدام
              </LocalizedClientLink>
              .
            </>
          ) : (
            <>
              By creating an account, you agree to Promptr&apos;s{" "}
              <LocalizedClientLink href="/privacy-policy" className="underline">
                Privacy Policy
              </LocalizedClientLink>{" "}
              and{" "}
              <LocalizedClientLink href="/terms" className="underline">
                Terms of Use
              </LocalizedClientLink>
              .
            </>
          )}
        </span>
        <SubmitButton className="w-full mt-6" data-testid="register-button">
          {isAR ? "إنشاء حساب" : "Join"}
        </SubmitButton>
      </form>
      <span className="text-center text-ui-fg-base text-small-regular mt-6">
        {isAR ? "لديك حساب بالفعل؟" : "Already a member?"}{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
          className="underline"
        >
          {isAR ? "تسجيل الدخول" : "Sign in"}
        </button>
        {!isAR && "."}
      </span>
    </div>
  )
}

export default Register
