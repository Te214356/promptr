import { HttpTypes } from "@medusajs/types"
import React from "react"

const PaymentWrapper: React.FC<{
  cart: HttpTypes.StoreCart
  children: React.ReactNode
}> = ({ children }) => {
  return <>{children}</>
}

export default PaymentWrapper
