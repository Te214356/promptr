import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { Resend } from "resend"
import { generateSignedUrl } from "../utils/signed-url"
import { buildOrderConfirmationEmail } from "../utils/email-templates"

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderId = data.id
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "email",
      "items.id",
      "items.title",
      "items.product_id",
    ],
    filters: { id: orderId },
  })

  const order = orders[0]
  if (!order) return

  const productIds = [
    ...new Set(
      (order.items ?? []).map((i: any) => i.product_id).filter(Boolean)
    ),
  ] as string[]

  if (!productIds.length) return

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "metadata"],
    filters: { id: productIds },
  })

  const metaMap = new Map(
    products.map((p: any) => [p.id, { title: p.title, metadata: p.metadata }])
  )

  const links: { title: string; url: string }[] = []

  for (const item of (order.items ?? []).filter(Boolean)) {
    const product = metaMap.get((item as any).product_id) as any
    const fileKey = product?.metadata?.file_key as string | undefined
    if (!fileKey) continue

    const url = await generateSignedUrl(fileKey)
    links.push({ title: product.title ?? (item as any).title, url })
  }

  if (!links.length) return

  // Log for monitoring
  console.log(`[order-placed] Order ${orderId} | ${order.email}`)
  for (const link of links) {
    console.log(`  ↳ ${link.title}: ${link.url}`)
  }

  // Send confirmation email — failure must not break order processing
  try {
    const displayId = (order as any).display_id ?? orderId.slice(-8)
    const { subject, html } = buildOrderConfirmationEmail({
      orderId,
      displayId,
      customerEmail: order.email as string,
      links,
    })

    const { error } = await resend.emails.send({
      from: `Promptr <${process.env.RESEND_FROM_EMAIL ?? "orders@promptrsa.com"}>`,
      to: [order.email as string],
      subject,
      html,
    })

    if (error) {
      console.error(`[order-placed] Resend error for ${orderId}:`, error)
    } else {
      console.log(`[order-placed] Email sent to ${order.email}`)
    }
  } catch (err: any) {
    console.error(`[order-placed] Failed to send email for ${orderId}:`, err?.message ?? err)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
