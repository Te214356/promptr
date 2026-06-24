"use client"

import FilterRadioGroup from "@modules/common/components/filter-radio-group"
import { useLanguage } from "@lib/context/language-context"

export type SortOptions = "price_asc" | "price_desc" | "created_at"

type SortProductsProps = {
  sortBy: SortOptions
  setQueryParams: (name: string, value: SortOptions) => void
  "data-testid"?: string
}

const SortProducts = ({
  "data-testid": dataTestId,
  sortBy,
  setQueryParams,
}: SortProductsProps) => {
  const { lang } = useLanguage()
  const isAR = lang === "ar"

  const sortOptions = [
    {
      value: "created_at",
      label: isAR ? "الأحدث" : "Latest Arrivals",
    },
    {
      value: "price_asc",
      label: isAR ? "السعر: من الأقل للأعلى" : "Price: Low -> High",
    },
    {
      value: "price_desc",
      label: isAR ? "السعر: من الأعلى للأقل" : "Price: High -> Low",
    },
  ]

  const handleChange = (value: SortOptions) => {
    setQueryParams("sortBy", value)
  }

  return (
    <FilterRadioGroup
      title={isAR ? "ترتيب حسب" : "Sort by"}
      items={sortOptions}
      value={sortBy}
      handleChange={handleChange}
      data-testid={dataTestId}
    />
  )
}

export default SortProducts
