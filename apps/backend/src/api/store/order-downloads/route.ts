import { MedusaStoreRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { generateSignedUrl } from "../../../utils/signed-url"

/* ── Rate limit ──────────────────────────────────────────────────────────────
 * Keyed on order_id, deliberately not on IP: the confirmation page calls this
 * route server-side ("use server" in the storefront), so every legitimate
 * buyer arrives from the same Railway address. An IP limit would throttle the
 * whole store or protect nothing.
 *
 * order_id is also the shape of the threat — whoever holds one order's id and
 * email can otherwise mint download links for it without end.
 *
 * Rejected (403) attempts count too, so guessing an email costs the same as a
 * real request.
 *
 * In-process on purpose: the backend runs as a single Railway service, and a
 * counter reset on deploy is not a meaningful weakness here. Move this to
 * Redis (REDIS_URL is already configured) the day the backend scales to more
 * than one instance — until then a network hop per download is not worth it.
 */
// 15, not 10: a buyer whose download stalls may reload the confirmation page
// several times, and 15 keeps them clear of the limit without giving a leaked
// order id any practical room.
const RATE_LIMIT_MAX = 15
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000

const hits = new Map<string, number[]>()

function checkRateLimit(orderId: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now()
  const cutoff = now - RATE_LIMIT_WINDOW_MS

  // Sweep expired keys so the map cannot grow without bound.
  for (const [key, timestamps] of hits) {
    const alive = timestamps.filter((t) => t > cutoff)
    if (alive.length) {
      hits.set(key, alive)
    } else {
      hits.delete(key)
    }
  }

  const recent = hits.get(orderId) ?? []

  if (recent.length >= RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((recent[0] + RATE_LIMIT_WINDOW_MS - now) / 1000)
    return { allowed: false, retryAfter: Math.max(retryAfter, 1) }
  }

  recent.push(now)
  hits.set(orderId, recent)
  return { allowed: true, retryAfter: 0 }
}

export async function GET(req: MedusaStoreRequest, res: MedusaResponse) {
  const orderId = req.query.order_id as string | undefined

  if (!orderId) {
    return res.status(400).json({ error: "order_id is required" })
  }

  const rate = checkRateLimit(orderId)

  if (!rate.allowed) {
    res.setHeader("Retry-After", String(rate.retryAfter))
    return res.status(429).json({
      message: "عدد كبير من الطلبات. حاول مرة أخرى بعد قليل.",
    })
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
