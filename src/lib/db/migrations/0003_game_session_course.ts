import type { Kysely } from "kysely"
import type { Database } from "../types"

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("game_session")
    .addColumn("course_id", "text", (col) =>
      col
        .notNull()
        .defaultTo("mfel1050")
        .references("course.id")
        .onDelete("cascade")
    )
    .execute()
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.alterTable("game_session").dropColumn("course_id").execute()
}
