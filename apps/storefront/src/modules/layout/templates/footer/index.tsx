import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import FooterClient from "./footer-client"

export default async function Footer() {
  const [{ collections }, productCategories] = await Promise.all([
    listCollections({ fields: "id,title,handle" }),
    listCategories(),
  ])

  return (
    <FooterClient
      collections={collections ?? []}
      categories={productCategories ?? []}
    />
  )
}
