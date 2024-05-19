import type {
  ExtendedGameSession,
  ExtendedGameSessionWithResults,
  GameSession,
  GameSessionCreate,
  Guess,
  GuessCreate,
} from "@/types/game"
import { db } from "../db"
import type { Question, QuestionWithOptions } from "@/types/question"
import { sql } from "kysely"
import type { Course } from "@/types/course"

export const createGameSession = async (
  data: GameSessionCreate
): Promise<GameSession> => {
  const gameSession = await db
    .insertInto("gameSession")
    .values(data)
    .returningAll()
    .executeTakeFirstOrThrow()

  return gameSession
}

export const updateGameSession = async (
  id: GameSession["id"],
  data: Partial<GameSessionCreate>
): Promise<GameSession> => {
  const gameSession = await db
    .updateTable("gameSession")
    .set({ ...data, updatedAt: new Date() })
    .where("id", "=", id)
    .returningAll()
    .executeTakeFirstOrThrow()

  return gameSession
}

export const getGameSession = async (
  gameSessionId: GameSession["id"]
): Promise<ExtendedGameSession | undefined> => {
  const gameSession = await db
    .selectFrom("gameSession")
    .selectAll("gameSession")
    .leftJoin("guess", "gameSession.id", "guess.gameSessionId")
    .select(({ fn }) => [fn.count<number>("guess.id").as("guessAmount")])
    .where("gameSession.id", "=", gameSessionId)
    .groupBy("gameSession.id")
    .executeTakeFirst()

  return gameSession
}

export const getGameSessionWithResults = async (
  gameSessionId: GameSession["id"]
): Promise<ExtendedGameSessionWithResults | undefined> => {
  const gameSession = await db
  .selectFrom("gameSession")
  .selectAll("gameSession")
  .leftJoin("guess", "gameSession.id", "guess.gameSessionId")
  .leftJoin("question", "guess.questionId", "question.id")
  .leftJoin("questionOption", "guess.optionId", "questionOption.id")
  .leftJoin("course", "question.courseId", "course.id")
  .select(({ fn, ref }) => [
    sql<Guess[]>`COALESCE(
      json_agg(
        json_build_object(
          'id', ${ref("guess.id")},
          'createdAt', ${ref("guess.createdAt")},
          'gameSessionId', ${ref("guess.gameSessionId")},
          'questionId', ${ref("guess.questionId")},
          'optionId', ${ref("guess.optionId")}
        )
      ) FILTER (WHERE ${ref("guess.id")} IS NOT NULL), '[]'
    )`.as("guesses"),
    sql<QuestionWithOptions[]>`COALESCE(
      json_agg(
        DISTINCT jsonb_build_object(
          'id', ${ref("question.id")},
          'createdAt', ${ref("question.createdAt")},
          'updatedAt', ${ref("question.updatedAt")},
          'courseId', ${ref("question.courseId")},
          'question', ${ref("question.question")},
          'origin', ${ref("question.origin")},
          'options', (
            SELECT COALESCE(json_agg(
              json_build_object(
                'id', question_option.id,
                'createdAt', question_option.created_at,
                'updatedAt', question_option.updated_at,
                'questionId', question_option.question_id,
                'option', question_option.option,
                'correct', question_option.correct
              )
            ) FILTER (WHERE question_option.id IS NOT NULL), '[]')
            FROM question_option
            WHERE question_option.question_id = question.id
          )
        )
      ) FILTER (WHERE ${ref("question.id")} IS NOT NULL), '[]'
    )`.as("questions"),
    fn.count<number>("guess.id").as("guessAmount"),
    sql<number>`COUNT(*) FILTER (WHERE ${ref("questionOption.correct")} = TRUE)`.as("amountCorrect"),
    sql<number>`COUNT(*) FILTER (WHERE ${ref("questionOption.correct")} = FALSE)`.as("amountIncorrect"),
    sql<Course>`json_build_object(
      'id', ${ref("course.id")},
      'createdAt', ${ref("course.createdAt")},
      'updatedAt', ${ref("course.updatedAt")},
      'name', ${ref("course.name")}
    )`.as("course"),
  ])
  .where("gameSession.id", "=", gameSessionId)
  .groupBy(["gameSession.id", "course.id"])
  .executeTakeFirst();

  return gameSession
}

export const addGuess = async (data: GuessCreate): Promise<Guess> => {
  const guess = await db
    .insertInto("guess")
    .values(data)
    .returningAll()
    .executeTakeFirstOrThrow()

  return guess
}

export const getGuess = async (
  gameSessionId: GameSession["id"],
  questionId: Question["id"]
): Promise<Guess | undefined> => {
  const guess = await db
    .selectFrom("guess")
    .selectAll("guess")
    .where("gameSessionId", "=", gameSessionId)
    .where("questionId", "=", questionId)
    .executeTakeFirst()

  return guess
}
