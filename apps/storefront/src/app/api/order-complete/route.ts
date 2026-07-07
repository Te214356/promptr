import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const orderId = searchParams.get("order_id")
  const countryCode = searchParams.get("country_code") ?? "sa"

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? request.nextUrl.origin

  const destination = orderId
    ? new URL(`/${countryCode}/order/${orderId}/confirmed`, baseUrl)
    : new URL(`/${countryCode}`, baseUrl)

  const response = NextResponse.redirect(destination)
  // Delete the cart cookie here — Route Handler context allows cookies().set()
  response.cookies.delete("_medusa_cart_id")

  return response
}
