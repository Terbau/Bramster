import type {
  Question,
  QuestionCreate,
  QuestionOption,
  QuestionOptionCreate,
  QuestionWithDetails,
} from "@/types/question"
import { db } from "../db"
import { sql } from "kysely"
import type { User } from "../db/types/user"
import type { Course } from "@/types/course"
import type { SortDirection } from "@/types/pagination"

export const getQuestionsAmount = async (
  courseIds?: Course["id"][],
  origins?: Question["origin"][],
  types?: Question["type"][],
  like?: string
): Promise<number> => {
  const amountOfQuestions = await db
    .selectFrom("question")
    .select(({ fn }) => [fn.count<number>("id").as("amount")])
    .$if(courseIds !== undefined && courseIds.length > 0, (qb) =>
      qb.where("courseId", "in", courseIds ?? [])
    )
    .$if(origins !== undefined && origins.length > 0, (qb) =>
      qb.where("origin", "in", origins ?? [])
    )
    .$if(types !== undefined && types.length > 0, (qb) =>
      qb.where("type", "in", types ?? [])
    )
    .$if(like !== undefined, (qb) =>
      qb.where((eb) =>
        eb("content", "ilike", `%${like}%`).or(
          "subContent",
          "ilike",
          `%${like}%`
        )
      )
    )
    .executeTakeFirst()

  return amountOfQuestions?.amount ?? 0
}

export const getQuestions = async (
  courseIds?: Course["id"][],
  origins?: Question["origin"][],
  types?: Question["type"][],
  page = 0,
  pageSize = -1,
  sortBy: keyof Question = "createdAt",
  sortDirection: SortDirection = "asc",
  like?: string,
  questionIds?: Question["id"][]
): Promise<Question[]> => {
  const questions = await db
    .selectFrom("question")
    .selectAll("question")
    .$if(courseIds !== undefined && courseIds.length > 0, (qb) =>
      qb.where("courseId", "in", courseIds ?? [])
    )
    .$if(origins !== undefined && origins.length > 0, (qb) =>
      qb.where("origin", "in", origins ?? [])
    )
    .$if(types !== undefined && types.length > 0, (qb) =>
      qb.where("type", "in", types ?? [])
    )
    .$if(pageSize > -1, (qb) => qb.limit(pageSize))
    .orderBy(sortBy, sortDirection)
    .offset(page * pageSize)
    .$if(like !== undefined, (qb) =>
      qb.where((eb) =>
        eb("content", "ilike", `%${like}%`).or(
          "subContent",
          "ilike",
          `%${like}%`
        )
      )
    )
    .$if(questionIds !== undefined && questionIds.length > 0, (qb) =>
      qb.where("id", "in", questionIds ?? [])
    )
    .execute()

  return questions
}

export const getQuestion = async (
  id: Question["id"]
): Promise<Question | undefined> => {
  const question = await db
    .selectFrom("question")
    .selectAll("question")
    .where("id", "=", id)
    .executeTakeFirst()
  return question
}

export const createQuestions = async (
  questions: QuestionCreate[]
): Promise<Question[]> => {
  const createdQuestions = await db
    .insertInto("question")
    .values(questions)
    .returningAll()
    .execute()

  if (createdQuestions.length === 0) {
    throw new Error("Failed to create questions")
  }

  return createdQuestions
}

export const createQuestion = async (
  question: QuestionCreate
): Promise<Question> => {
  const createdQuestions = await createQuestions([question])
  if (createdQuestions.length === 0) {
    throw new Error("Failed to create question")
  }

  return createdQuestions[0]
}

export const updateQuestion = async (
  questionId: Question["id"],
  data: QuestionCreate
): Promise<Question | undefined> => {
  const updatedQuestion = await db
    .updateTable("question")
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where("id", "=", questionId)
    .returningAll()
    .executeTakeFirst()

  return updatedQuestion
}

export const deleteQuestions = async (
  questionIds: Question["id"][]
): Promise<Question[]> => {
  const deletedQuestions = await db
    .deleteFrom("question")
    .where("id", "in", questionIds ?? [])
    .returningAll()
    .execute()

  return deletedQuestions
}

export const deleteQuestion = async (
  questionId: Question["id"]
): Promise<Question | undefined> => {
  const deletedQuestions = await deleteQuestions([questionId])

  if (deletedQuestions.length === 0) {
    return undefined
  }

  return deletedQuestions[0]
}

export const getQuestionOptions = async (
  questionId: Question["id"]
): Promise<QuestionOption[]> => {
  const questionOptions = await db
    .selectFrom("questionOption")
    .selectAll("questionOption")
    .where("questionId", "=", questionId)
    .execute()

  return questionOptions
}

export const getQuestionOption = async (
  id: QuestionOption["id"]
): Promise<QuestionOption | undefined> => {
  const questionOption = await db
    .selectFrom("questionOption")
    .selectAll("questionOption")
    .where("id", "=", id)
    .executeTakeFirst()

  return questionOption
}

export const createQuestionOptions = async (
  questionOptions: QuestionOptionCreate[]
): Promise<QuestionOption[]> => {
  const createdQuestionOptions = await db
    .insertInto("questionOption")
    .values(
      questionOptions.map((option) => ({
        ...option,
        correct: option.correct ?? false,
      }))
    )
    .returningAll()
    .execute()

  return createdQuestionOptions
}

export const createQuestionOption = async (
  questionOption: QuestionOptionCreate
): Promise<QuestionOption> => {
  const createdOptions = await createQuestionOptions([questionOption])
  if (createdOptions.length === 0) {
    throw new Error("Failed to create question option")
  }

  return createdOptions[0]
}

export const updateQuestionOption = async (
  questionOptionId: QuestionOption["id"],
  data: QuestionOptionCreate
): Promise<QuestionOption> => {
  const updatedQuestionOption = await db
    .updateTable("questionOption")
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where("id", "=", questionOptionId)
    .returningAll()
    .executeTakeFirstOrThrow()

  return updatedQuestionOption
}

export const updateQuestionOptions = async (
  questionOptionId: QuestionOption["id"],
  data: QuestionOptionCreate[]
): Promise<QuestionOption[]> => {
  // Using Promise.all to update all question options in parallel as
  // kysely doesn't support updating multiple rows at once in an easy way
  const updatedQuestionOptions = await Promise.all(
    data.map((option) => updateQuestionOption(questionOptionId, option))
  )
  return updatedQuestionOptions
}

export const deleteQuestionOptions = async (
  questionOptionIds: QuestionOption["id"][]
): Promise<QuestionOption[]> => {
  const deletedQuestionOptions = await db
    .deleteFrom("questionOption")
    .where("id", "in", questionOptionIds ?? [])
    .returningAll()
    .execute()

  return deletedQuestionOptions
}

export const deleteQuestionOption = async (
  questionOptionId: QuestionOption["id"]
): Promise<QuestionOption> => {
  const deletedQuestionOption = await db
    .deleteFrom("questionOption")
    .where("id", "=", questionOptionId)
    .returningAll()
    .executeTakeFirstOrThrow()

  return deletedQuestionOption
}

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
  courseId?: Course["id"],
  origin?: Question["origin"],
  limit = -1,
  isRandomOrder = false,
  questionIds?: Question["id"][]
): Promise<QuestionWithDetails[]> => {
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
    .$if(courseId !== undefined, (qb) =>
      qb.where("question.courseId", "=", courseId ?? "")
    )
    .$if(origin !== undefined && origin !== "all", (qb) =>
      qb.where("origin", "=", origin ?? "")
    )
    .$if(questionIds !== undefined && questionIds.length > 0, (qb) =>
      qb.where("question.id", "in", questionIds ?? [])
    )
    .groupBy("question.id")
    .$if(isRandomOrder, (qb) => qb.orderBy(sql`RANDOM()`))
    .$if(limit > 0, (qb) => qb.limit(limit))
    .execute()

  return questions.map((question) => ({
    ...question,
    allOrigins: [],
  }))
}

export const getQuestionsWithOptions = async (
  courseId: Course["id"],
  origin: Question["origin"],
  userId: User["id"],
  limit = -1,
  shouldOrderByWeightFirst = false,
  isRandomOrder = false
): Promise<QuestionWithDetails[]> => {
  const questions = await db
    .selectFrom("question")
    .selectAll("question")
    .leftJoin("questionOption", "question.id", "questionOption.questionId")
    .select(({ selectFrom, ref }) =>
      selectFrom("question as q2")
        .select(() => [
          sql<string[]>`COALESCE(json_agg(DISTINCT q2.origin), '[]')`.as(
            "allOrigins"
          ),
        ])
        .where("q2.content", "=", ref("question.content"))
        .as("allOrigins")
    )
    // Dynamic weight per question based on answerData and question type
    .select(({ ref }) => [
      sql<number>`COALESCE((
        SELECT SUM(
          CASE
            -- Single optionId-based answers
            WHEN ${ref("question.type")} IN ('MULTIPLE_CHOICE', 'SENTENCE_SELECT') THEN
              CASE
                WHEN (guess.answer_data->>'optionId')::uuid = question_option.id AND question_option.correct THEN 1
                WHEN (guess.answer_data->>'optionId')::uuid = question_option.id AND NOT question_option.correct THEN -1
                ELSE 0
              END

            -- Array-based answers (matrix)
            WHEN ${ref("question.type")} = 'MATRIX' THEN
              CASE
                WHEN question_option.id IN (
                  SELECT jsonb_array_elements_text(guess.answer_data->'optionIds')::uuid
                ) AND question_option.correct THEN 1
                WHEN question_option.id IN (
                  SELECT jsonb_array_elements_text(guess.answer_data->'optionIds')::uuid
                ) AND NOT question_option.correct THEN -1
                ELSE 0
              END

            -- Sentence fill
            WHEN ${ref("question.type")} = 'SENTENCE_FILL' THEN
              CASE
                WHEN LOWER(question_option.content) = LOWER((guess.answer_data->>'content')::text) AND question_option.correct THEN 1
                ELSE 0
              END

            -- Image drag and drop
            WHEN ${ref("question.type")} = 'IMAGE_DRAG_AND_DROP' THEN
              CASE
                WHEN (guess.answer_data->>'amountIncorrect')::int = 0 THEN 1
                WHEN (guess.answer_data->>'amountIncorrect')::int > 0 THEN -1
                ELSE 0
              END
            -- Default case
            ELSE 0
          END
        )
        FROM guess
        INNER JOIN game_session ON guess.game_session_id = game_session.id
        INNER JOIN question_option ON question_option.question_id = guess.question_id
        WHERE guess.question_id = ${ref("question.id")}
          AND game_session.user_id = ${userId}
      ), 0)`.as("weight"),
    ])
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
