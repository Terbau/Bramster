import { sql, type Kysely } from "kysely"
import type { Database } from "../types"

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createType("question_type")
    .asEnum([
      "MULTIPLE_CHOICE",
      "MATRIX",
      "SENTENCE_FILL",
      "SENTENCE_SELECT",
      "IMAGE_DRAG_AND_DROP",
    ])
    .execute()

  await db.schema
    .alterTable("question")
    .renameColumn("question", "content")
    .execute()

  await db.schema
    .alterTable("question")
    .addColumn("type", sql`question_type`, (col) =>
      col.notNull().defaultTo("MULTIPLE_CHOICE")
    )
    .addColumn("image_path", "text")
    .addColumn("image_height", "integer")
    .addColumn("image_width", "integer")
    .addColumn("sub_content", "text")
    .execute()

  await db.schema
    .alterTable("question_option")
    .addColumn("y_content", "text")
    .addColumn("x_coordinate", "integer")
    .addColumn("y_coordinate", "integer")
    .execute()

  await db.schema
    .alterTable("question_option")
    .renameColumn("option", "content")
    .execute()
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("question_option")
    .renameColumn("content", "option")
    .execute()

  await db.schema
    .alterTable("question_option")
    .dropColumn("y_content")
    .dropColumn("x_coordinate")
    .dropColumn("y_coordinate")
    .execute()

  await db.schema
    .alterTable("question")
    .dropColumn("type")
    .dropColumn("image_path")
    .dropColumn("image_height")
    .dropColumn("image_width")
    .dropColumn("sub_content")
    .execute()

  await db.schema
    .alterTable("question")
    .renameColumn("content", "question")
    .execute()

  await db.schema.dropType("question_type").execute()
}
