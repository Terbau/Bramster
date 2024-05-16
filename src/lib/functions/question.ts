import type { QuestionOption, QuestionWithOptions } from "@/types/question"
import { db } from "../db"
import { sql } from "kysely"

export const getQuestionsWithOptions = async (
  courseId: string,
  origin: string,
  limit = -1,
  isRandomOrder = false
): Promise<QuestionWithOptions[]> => {
  const questions = await db
    .selectFrom("question")
    .leftJoin("questionOption", "question.id", "questionOption.questionId")
    .selectAll("question")
    .select(({ ref }) => [
      sql<
        QuestionOption[]
      >`COALESCE(json_agg(question_option) FILTER (WHERE ${ref(
        "questionOption.id"
      )} IS NOT NULL), '[]')`.as("options"),
    ])
    .where("courseId", "=", courseId)
    .where("origin", "=", origin)
    .groupBy("question.id")
    .$if(isRandomOrder, (qb) => qb.orderBy(sql`RANDOM()`))
    .$if(limit > 0, (qb) => qb.limit(limit))
    .execute()

  return questions
}
