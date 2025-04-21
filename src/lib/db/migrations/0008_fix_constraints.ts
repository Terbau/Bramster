import { sql, type Kysely } from "kysely"
import type { Database } from "../types"

export async function up(db: Kysely<Database>): Promise<void> {
  await sql`
    ALTER TABLE question
    DROP CONSTRAINT IF EXISTS question_course_id_fkey,
    ADD CONSTRAINT question_course_id_fkey
    FOREIGN KEY (course_id)
    REFERENCES course(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
  `.execute(db)

  await sql`
    ALTER TABLE game_session
    DROP CONSTRAINT IF EXISTS game_session_course_id_fkey,
    ADD CONSTRAINT game_session_course_id_fkey
    FOREIGN KEY (course_id)
    REFERENCES course(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
  `.execute(db)

  await db.schema
    .alterTable("question_option")
    .dropConstraint("question_option_unique")
    .execute()
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("question_option")
    .addUniqueConstraint("question_option_unique", ["question_id", "content"])
    .execute()

  await sql`
    ALTER TABLE game_session
    DROP CONSTRAINT IF EXISTS game_session_course_id_fkey,
    ADD CONSTRAINT game_session_course_id_fkey
    FOREIGN KEY (course_id)
    REFERENCES course(id)
    ON DELETE CASCADE
  `.execute(db)

  await sql`
    ALTER TABLE question
    DROP CONSTRAINT IF EXISTS question_course_id_fkey,
    ADD CONSTRAINT question_course_id_fkey
    FOREIGN KEY (course_id)
    REFERENCES course(id)
    ON DELETE CASCADE
  `.execute(db)
}
