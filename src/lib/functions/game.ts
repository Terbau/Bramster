import type {
  ExtendedGameSession,
  ExtendedGameSessionWithResults,
  GameSession,
  GameSessionCreate,
  Guess,
  GuessCreate,
  ImageDragAndDropAnswer,
  MatrixAnswer,
  MultipleChoiceAnswer,
  SentenceFillAnswer,
  SentenceSelectAnswer,
} from "@/types/game"
import { db } from "../db"
import type { Question } from "@/types/question"
import { sql } from "kysely"
import type { Course } from "@/types/course"
import type { User } from "../db/types/user"
import { getQuestionsWithOptionsIgnoreWeight } from "./question"

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
    .leftJoin("course", "question.courseId", "course.id")
    .select(({ fn, ref }) => [
      sql<Guess[]>`COALESCE(
      json_agg(
        json_build_object(
          'id', ${ref("guess.id")},
          'createdAt', ${ref("guess.createdAt")},
          'gameSessionId', ${ref("guess.gameSessionId")},
          'questionId', ${ref("guess.questionId")},
          'answerData', ${ref("guess.answerData")}
        )
      ) FILTER (WHERE ${ref("guess.id")} IS NOT NULL), '[]'
    )`.as("guesses"),
      fn.count<number>("guess.id").as("guessAmount"),
      sql<Course>`json_build_object(
      'id', ${ref("course.id")},
      'createdAt', ${ref("course.createdAt")},
      'updatedAt', ${ref("course.updatedAt")},
      'name', ${ref("course.name")}
    )`.as("course"),
    ])
    .where("gameSession.id", "=", gameSessionId)
    .groupBy(["gameSession.id", "course.id"])
    .executeTakeFirst()

  if (!gameSession) return

  const questions = await getQuestionsWithOptionsIgnoreWeight(
    undefined,
    undefined,
    -1,
    false,
    gameSession?.guesses.map((guess) => guess.questionId)
  )
  const questionsMap = new Map(
    questions.map((question) => [question.id, question])
  )

  let amountCorrect = 0
  let amountIncorrect = 0

  for (const guess of gameSession?.guesses ?? []) {
    const question = questionsMap.get(guess.questionId)

    if (!question) continue

    let isCorrect = false
    const answerData = guess.answerData

    switch (question.type) {
      case "MULTIPLE_CHOICE":
        isCorrect = question.options.some(
          (option) =>
            option.id === (answerData as MultipleChoiceAnswer).optionId &&
            option.correct
        )
        break
      case "MATRIX":
        isCorrect = (answerData as MatrixAnswer).optionIds.every((optionId) =>
          question.options.some(
            (option) => option.id === optionId && option.correct
          )
        )
        break
      case "SENTENCE_FILL":
        isCorrect = question.options.some(
          (option) =>
            option.content.toLowerCase() ===
              (answerData as SentenceFillAnswer).content.toLowerCase() &&
            option.correct
        )
        break
      case "SENTENCE_SELECT":
        isCorrect = question.options.some(
          (option) =>
            option.id === (answerData as SentenceSelectAnswer).optionId &&
            option.correct
        )
        break
      case "IMAGE_DRAG_AND_DROP":
        isCorrect = Object.entries(
          (answerData as ImageDragAndDropAnswer).dragMap
        ).every(([droppableId, draggableId]) => droppableId === draggableId)
        break
      default:
        isCorrect = false
    }

    if (isCorrect) {
      amountCorrect++
    } else {
      amountIncorrect++
    }
  }

  return {
    ...gameSession,
    amountCorrect,
    amountIncorrect,
    questions,
  }
}

export const addGuess = async (data: GuessCreate): Promise<Guess> => {
  const guess = await db
    .insertInto("guess")
    .values(data)
    .returningAll()
    .executeTakeFirstOrThrow()

  return guess as Guess
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

  if (guess) {
    return guess as Guess
  }
}

export const getGameSessionsForUser = async (
  userId: User["id"],
  page = 0,
  limit = 30
): Promise<GameSession[]> => {
  const gameSessions = await db
    .selectFrom("gameSession")
    .selectAll("gameSession")
    .orderBy("createdAt", "desc")
    .where("userId", "=", userId)
    .where("finishedAt", "is not", null)
    .limit(limit)
    .offset(page * limit)
    .execute()

  return gameSessions
}

export const getTotalGameSessionsForUser = async (
  userId: User["id"]
): Promise<number> => {
  const row = await db
    .selectFrom("gameSession")
    .select(({ fn }) => [fn.count("id").as("count")])
    .where("userId", "=", userId)
    .where("finishedAt", "is not", null)
    .executeTakeFirst()

  return row ? Number(row.count) : 0
}
