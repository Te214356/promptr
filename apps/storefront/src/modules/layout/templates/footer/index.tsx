import { listCategories } from "@lib/data/categories"
import FooterClient from "./footer-client"

export default async function Footer() {
  const productCategories = await listCategories()

  return <FooterClient categories={productCategories ?? []} />
}
