import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Hand-written, not produced by `medusa db:generate`: generating it requires a
 * live database connection, and there is none on the machine this was written
 * on. It follows the shape Medusa emits for a `model.define` module — text id,
 * the three timestamps, a unique index named IDX_<table>_<column>_unique.
 *
 * ⚠️ One deliberate departure: the unique index is NOT partial.
 *
 * Medusa's generator writes `WHERE deleted_at IS NULL`, so a soft-deleted row
 * stops blocking new inserts. That is right for a name or an email — it is
 * wrong for this table, where the row means "this payment has already been
 * spent". Under a partial index, soft-deleting a claim would hand the payment
 * back for a second use, which is the exact outcome the table exists to
 * prevent. Spending is not undone by tidying up.
 *
 * So: if a future `db:generate` proposes narrowing this index with a
 * `deleted_at IS NULL` clause, that is a regression, not a cleanup.
 */
export class Migration20260903090000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `create table if not exists "moyasar_payment_claim" (` +
        `"id" text not null, ` +
        `"moyasar_id" text not null, ` +
        `"cart_id" text not null, ` +
        `"created_at" timestamptz not null default now(), ` +
        `"updated_at" timestamptz not null default now(), ` +
        `"deleted_at" timestamptz null, ` +
        `constraint "moyasar_payment_claim_pkey" primary key ("id"));`
    )

    // The whole mechanism. Concurrent completions both insert; Postgres admits
    // one and makes the other wait, then fail — so there is no read-then-write
    // window in which two carts can each conclude the payment is unspent.
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_moyasar_payment_claim_moyasar_id_unique" ` +
        `ON "moyasar_payment_claim" (moyasar_id);`
    )
  }

  async down(): Promise<void> {
    this.addSql(`drop table if exists "moyasar_payment_claim" cascade;`)
  }
}
