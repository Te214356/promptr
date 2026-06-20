import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import MoyasarProviderService from "./service"

export default ModuleProvider(Modules.PAYMENT, {
  services: [MoyasarProviderService],
})
