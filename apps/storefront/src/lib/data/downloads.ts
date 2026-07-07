"use server"

import { sdk } from "@lib/config"

export type OrderDownload = {
  product_title: string
  download_url: string
}

export const getOrderDownloads = async (
  orderId: string,
  email: string
): Promise<OrderDownload[]> => {
  try {
    const result = await sdk.client.fetch<{ downloads: OrderDownload[] }>(
      `/store/order-downloads`,
      {
        method: "GET",
        query: { order_id: orderId, email },
        cache: "no-store",
      }
    )
    return result.downloads ?? []
  } catch {
    return []
  }
}
