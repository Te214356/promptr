import { Client } from "pg"

const client = new Client({ connectionString: process.env.DATABASE_URL })
await client.connect()

const { rows } = await client.query(
  `SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   ORDER BY table_name`
)

console.log(`Tables (${rows.length} total):`)
rows.forEach(r => console.log(" ", r.table_name))

await client.end()
