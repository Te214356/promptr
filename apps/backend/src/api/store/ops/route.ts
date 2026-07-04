import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

// Temporary one-shot endpoint: set all published products to draft.
// Safe to call multiple times (idempotent). Remove after use.
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const productModule = req.scope.resolve("product") as any

  const allProducts = await productModule.listProducts({}, { take: 100 })
  const published = allProducts.filter((p: any) => p.status === "published")

  const results: string[] = []

  for (const product of published) {
    await productModule.updateProducts([{ id: product.id, status: "draft" }])
    results.push(`${product.title} → draft`)
  }

  res.json({
    total_found: published.length,
    updated: results.length,
    results,
  })
}
