import { sql, type Kysely } from "kysely"
import type { Database } from "../types"
import { createTableWithDefaults } from "../utils"

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createType("question_error_report_status")
    .asEnum(["OPEN", "RESOLVED"])
    .execute()

  await createTableWithDefaults(
    "question_error_report",
    { id: true, createdAt: true, updatedAt: true },
    db.schema
  )
    .addColumn("question_id", "uuid", (col) =>
      col
        .notNull()
        .references("question.id")
        .onDelete("cascade")
        .onUpdate("cascade")
    )
    .addColumn("created_by", "text", (col) =>
      col
        .notNull()
        .references("user.id")
        .onDelete("cascade")
        .onUpdate("cascade")
    )
    .addColumn("content", "text", (col) => col.notNull())
    .addColumn("status", sql`question_error_report_status`, (col) =>
      col.notNull().defaultTo("OPEN")
    )
    .addColumn("resolution", "text")
    .addColumn("resolution_date", "timestamptz")
    .execute()
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable("question_error_report").execute()
  await db.schema.dropType("question_error_report_status").execute()
}
