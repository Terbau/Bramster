import type { Kysely } from "kysely"
import type { Database } from "../types"
import { createTableWithDefaults } from "../utils"

export async function up(db: Kysely<Database>): Promise<void> {
  await createTableWithDefaults(
    "user",
    { id: false, createdAt: true, updatedAt: true },
    db.schema
  )
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("email", "text", (col) => col.notNull())
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("auth_provider", "text", (col) => col.notNull())
    .execute()
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable("user").execute()
}
