import { sql, type Kysely } from "kysely"
import type { Database } from "../types"

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("user")
    .addUniqueConstraint("user_email_provider_unique", [
      "email",
      "authProvider",
    ])
    .execute()

  await sql`
    ALTER TABLE game_session
    DROP CONSTRAINT IF EXISTS game_session_user_id_fkey,
    ADD CONSTRAINT game_session_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES "user"(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
  `.execute(db)
}

export async function down(db: Kysely<Database>): Promise<void> {
  await sql`
    ALTER TABLE game_session
    DROP CONSTRAINT IF EXISTS game_session_user_id_fkey,
    ADD CONSTRAINT game_session_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES "user"(id)
    ON DELETE CASCADE
  `.execute(db)

  await db.schema
    .alterTable("user")
    .dropConstraint("user_email_provider_unique")
    .execute()
}
