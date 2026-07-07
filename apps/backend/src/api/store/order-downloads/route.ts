import { MedusaStoreRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { generateSignedUrl } from "../../../utils/signed-url"

export async function GET(req: MedusaStoreRequest, res: MedusaResponse) {
  const orderId = req.query.order_id as string | undefined

  if (!orderId) {
    return res.status(400).json({ error: "order_id is required" })
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "email",
      "customer_id",
      "items.id",
      "items.title",
      "items.product_id",
    ],
    filters: { id: orderId },
  })

  const order = orders[0]

  // ── Ownership check ────────────────────────────────────────────────────────
  // Always 403 (never 404) so we don't leak whether an order ID exists.
  if (!order) {
    return res.status(403).json({ message: "unauthorized" })
  }

  const authCtx = req.auth_context
  const isLoggedIn = authCtx?.actor_type === "customer" && !!authCtx.actor_id

  if (isLoggedIn) {
    // Registered customer: verify they own this order
    if ((order as any).customer_id !== authCtx!.actor_id) {
      return res.status(403).json({ message: "unauthorized" })
    }
  } else {
    // Guest (no session): require email query param, compare case-insensitively
    const emailParam = (req.query.email as string | undefined)?.toLowerCase().trim()
    const orderEmail = ((order as any).email as string | undefined)?.toLowerCase().trim()

    if (!emailParam || !orderEmail || emailParam !== orderEmail) {
      return res.status(403).json({ message: "unauthorized" })
    }
  }
  // ──────────────────────────────────────────────────────────────────────────

  const productIds = [
    ...new Set(
      (order.items ?? []).map((i: any) => i.product_id).filter(Boolean)
    ),
  ] as string[]

  if (!productIds.length) {
    return res.json({ downloads: [] })
  }

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "metadata"],
    filters: { id: productIds },
  })

  const metaMap = new Map(
    products.map((p: any) => [p.id, { title: p.title, metadata: p.metadata }])
  )

  const downloads: { product_title: string; download_url: string }[] = []

  for (const item of (order.items ?? []).filter(Boolean)) {
    const product = metaMap.get((item as any).product_id) as any
    const fileKey = product?.metadata?.file_key as string | undefined
    if (!fileKey) continue

    const url = await generateSignedUrl(fileKey)
    downloads.push({
      product_title: product.title ?? (item as any).title,
      download_url: url,
    })
  }

  res.json({ downloads })
}
