import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const orderId = searchParams.get("order_id")
  const countryCode = searchParams.get("country_code") ?? "sa"

  const destination = orderId
    ? new URL(`/${countryCode}/order/${orderId}/confirmed`, request.url)
    : new URL(`/${countryCode}`, request.url)

  const response = NextResponse.redirect(destination)
  // Delete the cart cookie here — Route Handler context allows cookies().set()
  response.cookies.delete("_medusa_cart_id")

  return response
}
