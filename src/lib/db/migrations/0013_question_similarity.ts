import type { Kysely } from "kysely"
import type { Database } from "../types"
import { createTableWithDefaults } from "../utils"

export async function up(db: Kysely<Database>): Promise<void> {
  await createTableWithDefaults(
    "question_similarity",
    { id: true, createdAt: true },
    db.schema
  )
    .addColumn("question_id", "uuid", (col) =>
      col
        .notNull()
        .references("question.id")
        .onDelete("cascade")
        .onUpdate("cascade")
    )
    .addColumn("similar_question_id", "uuid", (col) =>
      col
        .notNull()
        .references("question.id")
        .onDelete("cascade")
        .onUpdate("cascade")
    )
    .addColumn("similarity", "float4", (col) => col.notNull())
    .addUniqueConstraint("question_similarity_unique", [
      "question_id",
      "similar_question_id",
    ])
    .execute()
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable("question_similarity").execute()
}
