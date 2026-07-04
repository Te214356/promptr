import { ExecArgs } from "@medusajs/framework/types"

export default async function auditProducts({ container }: ExecArgs) {
  const productModule = container.resolve("productModuleService") as any
  const logger = container.resolve("logger") as any

  const { products } = await productModule.listAndCountProducts(
    {},
    { relations: ["images", "variants"], take: 100 }
  )

  logger.info(`\n===== PRODUCT AUDIT (${products.length} products) =====\n`)

  for (const product of products) {
    logger.info(`--- ${product.title} ---`)
    logger.info(`  id:       ${product.id}`)
    logger.info(`  handle:   ${product.handle}`)
    logger.info(`  status:   ${product.status}`)
    logger.info(`  metadata: ${JSON.stringify(product.metadata)}`)
    logger.info(`  images:   ${(product.images || []).map((i: any) => i.url).join(", ") || "(none)"}`)
    logger.info(`  thumbnail: ${product.thumbnail || "(none)"}`)
    for (const variant of product.variants || []) {
      logger.info(`  variant: ${variant.title} | metadata: ${JSON.stringify(variant.metadata)}`)
    }
    logger.info("")
  }

  logger.info("===== END AUDIT =====")
}
