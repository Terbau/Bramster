import { sql, type Kysely } from "kysely"
import type { Database } from "../types"
import type { AnswerData } from "@/types/game"

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("guess")
    .addColumn("answer_data", "jsonb")
    .execute()

  // Need to add all the existing data to the new column
  const guesses = await db
    .selectFrom("guess")
    .selectAll("guess")
    .innerJoin("question", "guess.questionId", "question.id")
    .select("question.type")
    .execute()

  const updates = guesses.map((guess) => {
    const optionId = (guess as unknown as { optionId: string }).optionId // Extreme workaround. It exists

    let answerData: AnswerData | undefined
    if (guess.type === "MULTIPLE_CHOICE") {
      answerData = { optionId }
    }

    if (!answerData) {
      throw new Error(`Type cannot be migrated: ${guess.type}`)
    }

    return {
      id: guess.id,
      gameSessionId: guess.gameSessionId,
      questionId: guess.questionId,
      optionId: optionId,
      answerData,
    }
  })

  // Create chunks of updates of 300 to avoid exceeding the max number of parameters
  const chunkSize = 300
  const chunks = []
  for (let i = 0; i < updates.length; i += chunkSize) {
    chunks.push(updates.slice(i, i + chunkSize))
  }

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    await db
      .updateTable("guess")
      .from(
        chunk
          .slice(1)
          .reduce(
            (qb, update) => {
              return qb.union(
                db.selectNoFrom([
                  sql`${update.id}::uuid`.as("id"),
                  sql`${update.gameSessionId}::uuid`.as("gameSessionId"),
                  sql`${update.questionId}::uuid`.as("questionId"),
                  sql`${update.optionId}::uuid`.as("optionId"),
                  sql`${JSON.stringify(update.answerData)}::jsonb`.as(
                    "answer_data"
                  ),
                ])
              )
            },
            db.selectNoFrom([
              sql`${chunk[0].id}::uuid`.as("id"),
              sql`${chunk[0].gameSessionId}::uuid`.as("gameSessionId"),
              sql`${chunk[0].questionId}::uuid`.as("questionId"),
              sql`${chunk[0].optionId}::uuid`.as("optionId"),
              sql`${JSON.stringify(chunk[0].answerData)}::jsonb`.as(
                "answer_data"
              ),
            ])
          )
          .as("data_table")
      )
      .set((eb) => ({
        answerData: eb.ref("data_table.answer_data"),
      }))
      .whereRef("guess.id", "=", "data_table.id")
      .execute()

    console.log("Updated chunk", i + 1, "of", chunks.length)
  }

  // await db.schema.alterTable("guess").dropColumn("optionId").execute()
}

export async function down(db: Kysely<Database>): Promise<void> {
  // WARNING: No way back here
  throw new Error("This migration is irreversible")

  // await db.schema.alterTable("guess").dropColumn("answer_data").execute()
}
