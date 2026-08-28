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
  const deliveredKeys: string[] = []
  const missingFileKey: string[] = []

  for (const item of (order.items ?? []).filter(Boolean)) {
    const product = metaMap.get((item as any).product_id) as any
    const fileKey = product?.metadata?.file_key as string | undefined
    if (!fileKey) {
      missingFileKey.push((item as any).product_id ?? "unknown")
      continue
    }

    const url = await generateSignedUrl(fileKey)
    links.push({ title: product.title ?? (item as any).title, url })
    deliveredKeys.push(fileKey)
  }

  // A paid item with no metadata.file_key is silently undeliverable: the buyer
  // is charged and receives nothing. Never let that pass without a log line.
  if (missingFileKey.length) {
    console.error(
      `[order-placed] Order ${orderId} | ${order.email} | ` +
      `${missingFileKey.length} item(s) have NO metadata.file_key and will not be ` +
      `delivered — set it in Medusa Admin. product_ids=${[...new Set(missingFileKey)].join(", ")}`
    )
  }

  if (!links.length) {
    console.error(
      `[order-placed] Order ${orderId} | ${order.email} | NO EMAIL SENT — not one ` +
      `item in this order carries metadata.file_key. The buyer has paid and ` +
      `received nothing. product_ids=${productIds.join(", ")}`
    )
    return
  }

  // Log for monitoring. Signed URLs are bearer tokens valid for 48h, so they are
  // never printed — anyone with log access would otherwise hold every purchase.
  console.log(
    `[order-placed] Order ${orderId} | ${order.email} | ` +
    `${links.length} link(s) generated: ${deliveredKeys.join(", ")}`
  )

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
