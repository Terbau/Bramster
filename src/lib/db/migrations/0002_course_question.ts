import type { Kysely } from "kysely"
import type { Database } from "../types"
import { createTableWithDefaults } from "../utils"

export async function up(db: Kysely<Database>): Promise<void> {
  await createTableWithDefaults(
    "course",
    { id: false, createdAt: true, updatedAt: true },
    db.schema
  )
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("name", "text", (col) => col.notNull())
    .execute()

  await createTableWithDefaults(
    "question",
    { id: true, createdAt: true, updatedAt: true },
    db.schema
  )
    .addColumn("course_id", "text", (col) =>
      col.notNull().references("course.id").onDelete("cascade")
    )
    .addColumn("question", "text", (col) => col.notNull())
    .addColumn("origin", "text", (col) => col.notNull().defaultTo("manual"))
    .execute()

  await createTableWithDefaults(
    "question_option",
    { id: true, createdAt: true, updatedAt: true },
    db.schema
  )
    .addColumn("question_id", "uuid", (col) =>
      col.notNull().references("question.id").onDelete("cascade")
    )
    .addColumn("option", "text", (col) => col.notNull())
    .addColumn("correct", "boolean", (col) => col.notNull())
    .addUniqueConstraint("question_option_unique", ["question_id", "option"])
    .execute()

  await createTableWithDefaults(
    "game_session",
    { id: true, createdAt: true, updatedAt: true },
    db.schema
  )
    .addColumn("user_id", "text", (col) =>
      col.notNull().references("user.id").onDelete("cascade")
    )
    .addColumn("amount_questions", "integer", (col) => col.notNull())
    .addColumn("finished_at", "timestamptz")
    .execute()

  await createTableWithDefaults(
    "guess",
    { id: true, createdAt: true, updatedAt: false },
    db.schema
  )
    .addColumn("question_id", "uuid", (col) =>
      col.notNull().references("question.id").onDelete("cascade")
    )
    .addColumn("option_id", "uuid", (col) =>
      col.notNull().references("question_option.id").onDelete("cascade")
    )
    .addColumn("game_session_id", "uuid", (col) =>
      col.notNull().references("game_session.id").onDelete("cascade")
    )
    .execute()
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable("guess").execute()
  await db.schema.dropTable("game_session").execute()
  await db.schema.dropTable("question_option").execute()
  await db.schema.dropTable("question").execute()
  await db.schema.dropTable("course").execute()
}
