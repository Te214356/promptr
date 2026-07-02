import { ExecArgs } from "@medusajs/framework/types"

const OLD_BASE = "https://dtcbackend-production-32a2.up.railway.app/static"
const NEW_BASE = "https://pub-8e6feaf55e8e2b16e30e47579b3213ac.r2.dev"

export default async function migrateImagesToR2({ container }: ExecArgs) {
  const productModule = container.resolve("productModuleService") as any
  const logger = container.resolve("logger") as any

  const { products } = await productModule.listAndCountProducts(
    {},
    { relations: ["images"], take: 100 }
  )

  logger.info(`Migrating images for ${products.length} products...`)
  let updated = 0

  for (const product of products) {
    const oldThumb = product.thumbnail || ""
    const newThumb = oldThumb.startsWith(OLD_BASE)
      ? oldThumb.replace(OLD_BASE, NEW_BASE)
      : oldThumb

    const newImages = (product.images || []).map((img: any) => ({
      id: img.id,
      url: img.url?.startsWith(OLD_BASE)
        ? img.url.replace(OLD_BASE, NEW_BASE)
        : img.url,
    }))

    const hasChange =
      newThumb !== oldThumb ||
      newImages.some((img: any, i: number) => img.url !== product.images[i]?.url)

    if (!hasChange) continue

    await productModule.updateProducts(product.id, {
      thumbnail: newThumb,
      images: newImages,
    })
    logger.info(`  ✓ ${product.title}: ${oldThumb.split("/").pop()} -> R2`)
    updated++
  }

  logger.info(`Done. Updated ${updated}/${products.length} products.`)
}
