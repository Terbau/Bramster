import type {
  Question,
  QuestionOption,
  QuestionWithOptions,
} from "@/types/question"
import { db } from "../db"
import { sql } from "kysely"
import type { User } from "../db/types/user"
import type { Course } from "@/types/course"

export const getAmountOfQuestionsForOrigin = async (
  courseId: Course["id"],
  origin: Question["origin"]
): Promise<number> => {
  const amountOfQuestions = await db
    .selectFrom("question")
    .select(({ fn }) => [fn.count<number>("id").as("amount")])
    .where("courseId", "=", courseId)
    .$if(origin !== "all", (qb) => qb.where("origin", "=", origin))
    .executeTakeFirst()

  return amountOfQuestions?.amount ?? 0
}

export const getQuestionsWithOptionsIgnoreWeight = async (
  courseId: Course["id"],
  origin: Question["origin"],
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
      sql<number>`0`.as("weight"),
    ])
    .where("courseId", "=", courseId)
    .$if(origin !== "all", (qb) => qb.where("origin", "=", origin))
    .groupBy("question.id")
    .$if(isRandomOrder, (qb) => qb.orderBy(sql`RANDOM()`))
    .$if(limit > 0, (qb) => qb.limit(limit))
    .execute()

  return questions
}

export const getQuestionsWithOptions = async (
  courseId: Course["id"],
  origin: Question["origin"],
  userId: User["id"],
  limit = -1,
  shouldOrderByWeightFirst = false,
  isRandomOrder = false
): Promise<QuestionWithOptions[]> => {
  const questions = await db
    .selectFrom("question")
    .selectAll("question")
    .leftJoin("questionOption", "question.id", "questionOption.questionId")
    .select(({ selectFrom }) =>
      selectFrom("guess")
        .innerJoin("gameSession", "guess.gameSessionId", "gameSession.id")
        .innerJoin("questionOption", "guess.optionId", "questionOption.id")
        .whereRef("guess.questionId", "=", "question.id")
        .where("gameSession.userId", "=", userId)
        .select(() => [
          sql<number>`COALESCE(SUM(CASE WHEN question_option.correct THEN 1 ELSE -1 END), 0)`.as(
            "weight"
          ),
        ])
        .as("weight")
    )
    .select(({ ref }) =>
      sql<
        QuestionOption[]
      >`COALESCE(json_agg(question_option) FILTER (WHERE ${ref(
        "questionOption.id"
      )} IS NOT NULL), '[]')`.as("options")
    )
    .where("question.courseId", "=", courseId)
    .groupBy("question.id")
    .$if(origin !== "all", (qb) => qb.where("question.origin", "=", origin))
    .$if(limit > 0, (qb) => qb.limit(limit))
    .$if(shouldOrderByWeightFirst, (qb) => qb.orderBy("weight", "asc"))
    .$if(isRandomOrder, (qb) => qb.orderBy(sql`RANDOM()`))
    .execute()

  return questions
}
