import type { Kysely } from "kysely"
import type { Database } from "../types"

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema.alterTable("guess").dropColumn("option_id").execute()
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("guess")
    .addColumn("option_id", "uuid", (col) =>
      col.references("question_option.id").onDelete("cascade")
    )
    .execute()
}
