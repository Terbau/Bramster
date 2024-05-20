import type { Kysely } from "kysely"
import type { Database } from "../types"

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema.alterTable("question").addColumn("label", "text").execute()
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.alterTable("question").dropColumn("label").execute()
}
