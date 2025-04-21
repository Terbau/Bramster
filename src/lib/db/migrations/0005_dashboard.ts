import type { Kysely } from "kysely"
import type { Database } from "../types"

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("user")
    .addColumn("admin", "boolean", (col) => col.notNull().defaultTo(false))
    .execute()
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.alterTable("user").dropColumn("admin").execute()
}
