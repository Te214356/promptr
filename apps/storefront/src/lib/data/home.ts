import { HttpTypes } from "@medusajs/types"

import { listCategories } from "./categories"
import { listProducts } from "./products"

export type HomeCover = { src: string; title: string; handle: string }

export type HomeCategoryCard = {
  handle: string
  /** Category name as entered in Admin (Arabic). */
  name: string
  count: number
  covers: HomeCover[]
}

export type HomeCatalogue = {
  /** Products on the rail under the hero. */
  rail: HttpTypes.StoreProduct[]
  /** Covers on the hero shelf. */
  shelf: HomeCover[]
  cards: HomeCategoryCard[]
}

/** Rail length. Six, not eight: see the allocation note below. */
const RAIL_COUNT = 6
const SHELF_COUNT = 3
const COVERS_PER_CARD = 2
/** Enough of the catalogue to fill the rail after the cards took theirs. */
const CATALOGUE_FETCH = 24

const toCover = (p: HttpTypes.StoreProduct): HomeCover => ({
  src: p.thumbnail as string,
  title: p.title,
  handle: p.handle as string,
})

/*
  One place decides which cover goes where on the home page, so the same
  artwork is not shown twice a screen apart.

  The catalogue has 12 products. A rail of 8 plus 3 covers per category card
  (3+3+1) is 15 slots, so at least three covers had to repeat whatever was
  picked (measured: three did). The allocation instead is:

    category cards  2 covers each, 1 where the category has one   → 5
    rail            the next 6 products not used by a card        → 6
    hero shelf      the leftover product, then the rail's last two

  The shelf overlaps the rail on purpose (it always did) but only with the
  rail's second row, which sits below the fold on a desktop viewport.

  Counts and covers per category come from `/store/products?category_id=…`,
  the query the category page itself runs — not from the `*products`
  expansion on `/store/product-categories`, which also returns products the
  storefront cannot see (8/6/3 where the pages show 8/3/1; CLAUDE.md note 7).
  Everything here shares the catalogue's 60-second revalidate.
*/
export async function getHomeCatalogue(
  countryCode: string
): Promise<HomeCatalogue> {
  let products: HttpTypes.StoreProduct[] = []
  try {
    products = (
      await listProducts({ countryCode, queryParams: { limit: CATALOGUE_FETCH } })
    ).response.products
  } catch (e) {
    console.error("[home] product fetch failed, rendering without the shelf", e)
  }

  let categories: HttpTypes.StoreProductCategory[] = []
  try {
    categories = (
      await listCategories({ fields: "id,handle,name,parent_category_id" })
    ).filter((c) => !c.parent_category_id)
  } catch (e) {
    console.error("[home] category fetch failed, hiding the category cards", e)
  }

  const used = new Set<string>()

  const cards: HomeCategoryCard[] = []
  for (const category of categories) {
    try {
      const {
        response: { products: inCategory, count },
      } = await listProducts({
        countryCode,
        queryParams: {
          category_id: [category.id],
          limit: CATALOGUE_FETCH,
          fields: "id,handle,title,thumbnail",
        },
      })
      const covers = inCategory
        .filter((p) => p.thumbnail && !used.has(p.id))
        .slice(0, COVERS_PER_CARD)
      covers.forEach((p) => used.add(p.id))
      cards.push({
        handle: category.handle,
        name: category.name,
        count,
        covers: covers.map(toCover),
      })
    } catch (e) {
      console.error(`[home] products for category ${category.handle} failed`, e)
      cards.push({ handle: category.handle, name: category.name, count: 0, covers: [] })
    }
  }

  const rail = products.filter((p) => !used.has(p.id)).slice(0, RAIL_COUNT)
  rail.forEach((p) => used.add(p.id))

  const leftovers = products.filter((p) => !used.has(p.id) && p.thumbnail)
  const shelf = [...leftovers, ...rail.filter((p) => p.thumbnail).reverse()]
    .slice(0, SHELF_COUNT)
    .map(toCover)

  return { rail, shelf, cards }
}
