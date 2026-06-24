import { isEmpty } from "./isEmpty"

type ConvertToLocaleParams = {
  amount: number
  currency_code: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  locale?: string
}

export const convertToLocale = ({
  amount,
  currency_code,
  minimumFractionDigits,
  maximumFractionDigits,
  locale = "en-US",
}: ConvertToLocaleParams) => {
  if (!currency_code || isEmpty(currency_code)) {
    return amount.toString()
  }

  // Medusa stores amounts in the smallest currency unit (e.g. halalas for SAR).
  // Divide by 10^fractionDigits to convert to the major unit before formatting.
  const fractionDigits = new Intl.NumberFormat("en", {
    style: "currency",
    currency: currency_code,
  }).resolvedOptions().maximumFractionDigits

  const divisor = Math.pow(10, fractionDigits ?? 2)

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency_code,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount / divisor)
}
