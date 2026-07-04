import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

// Temporary one-shot endpoint: set all published products to draft.
// Safe to call multiple times (idempotent). Remove after use.
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const productModule = req.scope.resolve("productModuleService") as any

  const { products } = await productModule.listAndCountProducts(
    { status: ["published"] },
    { take: 100 }
  )

  const results: string[] = []

  for (const product of products) {
    await productModule.updateProducts(product.id, { status: "draft" })
    results.push(`${product.title} → draft`)
  }

  res.json({
    total_found: products.length,
    updated: results.length,
    results,
  })
}
