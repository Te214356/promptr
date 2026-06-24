"use client"

import { login } from "@lib/data/customer"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import { useActionState } from "react"
import { useLanguage } from "@lib/context/language-context"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Login = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(login, null)
  const { lang } = useLanguage()
  const isAR = lang === "ar"

  return (
    <div
      className="max-w-sm w-full flex flex-col items-center"
      data-testid="login-page"
      dir={isAR ? "rtl" : "ltr"}
    >
      <h1 className="text-large-semi uppercase mb-6">
        {isAR ? "أهلاً بعودتك" : "Welcome back"}
      </h1>
      <p className="text-center text-base-regular text-ui-fg-base mb-8">
        {isAR
          ? "سجّل دخولك للوصول لتجربة تسوق متميزة."
          : "Sign in to access an enhanced shopping experience."}
      </p>
      <form className="w-full" action={formAction}>
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label={isAR ? "البريد الإلكتروني" : "Email"}
            name="email"
            type="email"
            title={isAR ? "أدخل بريدًا إلكترونيًا صحيحًا." : "Enter a valid email address."}
            autoComplete="email"
            required
            data-testid="email-input"
          />
          <Input
            label={isAR ? "كلمة المرور" : "Password"}
            name="password"
            type="password"
            autoComplete="current-password"
            required
            data-testid="password-input"
          />
        </div>
        <ErrorMessage error={message} data-testid="login-error-message" />
        <SubmitButton data-testid="sign-in-button" className="w-full mt-6">
          {isAR ? "تسجيل الدخول" : "Sign in"}
        </SubmitButton>
      </form>
      <span className="text-center text-ui-fg-base text-small-regular mt-6">
        {isAR ? "ليس لديك حساب؟" : "Not a member?"}{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
          className="underline"
          data-testid="register-button"
        >
          {isAR ? "انضم إلينا" : "Join us"}
        </button>
        {!isAR && "."}
      </span>
    </div>
  )
}

export default Login
