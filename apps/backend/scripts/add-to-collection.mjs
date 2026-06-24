import { Client } from "pg"
import crypto from "crypto"

const client = new Client({ connectionString: process.env.DATABASE_URL })
await client.connect()

const PRODUCT_HANDLE = "chatgpt-prompts-pro-arabic"
const COLLECTION_TITLE = "قسم AI"
const COLLECTION_HANDLE = "ai-section"

// Find the product
const { rows: products } = await client.query(
  "SELECT id, title, collection_id FROM product WHERE handle = $1 AND deleted_at IS NULL",
  [PRODUCT_HANDLE]
)

if (!products.length) {
  console.error(`❌ Product not found: ${PRODUCT_HANDLE}`)
  await client.end()
  process.exit(1)
}

const product = products[0]
console.log(`✓ Product found: ${product.id} — ${product.title}`)

// Check if collection exists
const { rows: collections } = await client.query(
  "SELECT id, title FROM product_collection WHERE handle = $1 AND deleted_at IS NULL",
  [COLLECTION_HANDLE]
)

let collectionId
if (collections.length) {
  collectionId = collections[0].id
  console.log(`✓ Collection exists: ${collectionId} — ${collections[0].title}`)
} else {
  // Create the collection
  collectionId = crypto.randomUUID().replace(/-/g, "").substring(0, 26)
  collectionId = `pcol_${collectionId}`
  const now = new Date().toISOString()
  await client.query(
    `INSERT INTO product_collection (id, title, handle, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [collectionId, COLLECTION_TITLE, COLLECTION_HANDLE, now, now]
  )
  console.log(`✓ Collection created: ${collectionId} — ${COLLECTION_TITLE}`)
}

// Link product to collection
if (product.collection_id === collectionId) {
  console.log("✓ Product already in this collection.")
} else {
  await client.query(
    "UPDATE product SET collection_id = $1, updated_at = NOW() WHERE id = $2",
    [collectionId, product.id]
  )
  console.log(`✓ Product linked to collection: ${COLLECTION_TITLE}`)
}

await client.end()
console.log("Done.")
