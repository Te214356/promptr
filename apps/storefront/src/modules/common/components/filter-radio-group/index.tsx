"use client"

import { Label, RadioGroup, Text, clx } from "@medusajs/ui"
import { useLanguage } from "@lib/context/language-context"

type FilterRadioGroupProps = {
  title: string
  items: {
    value: string
    label: string
  }[]
  value: any
  handleChange: (...args: any[]) => void
  "data-testid"?: string
}

/**
 * The active option is marked by colour and a short rule in the brand
 * colour, not by the Medusa starter's `EllipseMiniSolid` dot hung off a
 * `ml-[-23px]` — that dot read as a stray list bullet, and the negative
 * left margin pointed the wrong way under RTL.
 */
const FilterRadioGroup = ({
  title,
  items,
  value,
  handleChange,
  "data-testid": dataTestId,
}: FilterRadioGroupProps) => {
  // Radix RadioGroup renders `dir="ltr"` unless told otherwise, which put the
  // active-option rule on the left of Arabic labels (seen on production).
  const { lang } = useLanguage()

  return (
    <div className="flex flex-col gap-y-3">
      <Text className="txt-compact-small-plus text-ui-fg-muted">{title}</Text>
      <RadioGroup
        data-testid={dataTestId}
        onValueChange={handleChange}
        dir={lang === "ar" ? "rtl" : "ltr"}
        className="flex flex-col gap-y-1"
      >
        {items?.map((i) => {
          const active = i.value === value
          return (
            <div key={i.value} className="flex items-center gap-x-3">
              <span
                aria-hidden
                className={clx(
                  "h-px w-4 shrink-0 transition-[background-color,width] duration-200",
                  active ? "bg-[#6C2BFF]" : "bg-transparent"
                )}
              />
              <RadioGroup.Item
                checked={active}
                className="hidden peer"
                id={i.value}
                value={i.value}
              />
              <Label
                htmlFor={i.value}
                className={clx(
                  "!txt-compact-small !transform-none hover:cursor-pointer transition-colors duration-200",
                  active ? "text-white" : "text-white/55 hover:text-white/85"
                )}
                data-testid="radio-label"
                data-active={active}
              >
                {i.label}
              </Label>
            </div>
          )
        })}
      </RadioGroup>
    </div>
  )
}

export default FilterRadioGroup
