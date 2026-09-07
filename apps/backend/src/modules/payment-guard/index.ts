import { Module } from "@medusajs/framework/utils"
import PaymentGuardService from "./service"

export const PAYMENT_GUARD_MODULE = "payment_guard"

export default Module(PAYMENT_GUARD_MODULE, {
  service: PaymentGuardService,
})
