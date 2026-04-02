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

export type RawCourseStatRow = {
  courseId: string
  courseName: string
  sessionCount: number
  totalCorrect: number
  totalQuestions: number
  lastAttempted: Date
}

export const getGameStatsForUser = async (
  userId: User["id"]
): Promise<RawCourseStatRow[]> => {
  const allSessions = await db
    .selectFrom("gameSession")
    .selectAll("gameSession")
    .innerJoin("course", "gameSession.courseId", "course.id")
    .select(["course.name as courseName"])
    .where("gameSession.userId", "=", userId)
    .where("gameSession.finishedAt", "is not", null)
    .execute()

  if (allSessions.length === 0) return []

  const sessionIds = allSessions.map((s) => s.id)

  const allGuesses = (await db
    .selectFrom("guess")
    .selectAll()
    .where("gameSessionId", "in", sessionIds)
    .execute()) as Guess[]

  if (allGuesses.length === 0) {
    const courseMap = new Map<string, RawCourseStatRow>()
    for (const session of allSessions) {
      const finishedAt = session.finishedAt ?? new Date()
      const existing = courseMap.get(session.courseId)
      if (!existing) {
        courseMap.set(session.courseId, {
          courseId: session.courseId,
          courseName: (session as typeof session & { courseName: string }).courseName,
          sessionCount: 1,
          totalCorrect: 0,
          totalQuestions: 0,
          lastAttempted: finishedAt,
        })
      } else {
        existing.sessionCount++
        if (finishedAt > existing.lastAttempted) existing.lastAttempted = finishedAt
      }
    }
    return Array.from(courseMap.values())
  }

  const questionIds = [...new Set(allGuesses.map((g) => g.questionId))]
  const questions = await getQuestionsWithOptionsIgnoreWeight(
    undefined,
    undefined,
    -1,
    false,
    questionIds
  )
  const questionsMap = new Map(questions.map((q) => [q.id, q]))

  const guessesBySession = new Map<string, Guess[]>()
  for (const guess of allGuesses) {
    const list = guessesBySession.get(guess.gameSessionId) ?? []
    list.push(guess)
    guessesBySession.set(guess.gameSessionId, list)
  }

  const courseMap = new Map<string, RawCourseStatRow>()
  for (const session of allSessions) {
    const guesses = guessesBySession.get(session.id) ?? []
    const finishedAt = session.finishedAt ?? new Date()
    const courseName = (session as typeof session & { courseName: string }).courseName

    let sessionCorrect = 0
    for (const guess of guesses) {
      const question = questionsMap.get(guess.questionId)
      if (!question) continue
      const answerData = guess.answerData
      let isCorrect = false

      switch (question.type) {
        case "MULTIPLE_CHOICE":
          isCorrect = question.options.some(
            (o) => o.id === (answerData as MultipleChoiceAnswer).optionId && o.correct
          )
          break
        case "MATRIX":
          isCorrect = (answerData as MatrixAnswer).optionIds.every((id) =>
            question.options.some((o) => o.id === id && o.correct)
          )
          break
        case "SENTENCE_FILL":
          isCorrect = question.options.some(
            (o) =>
              o.content.toLowerCase() ===
                (answerData as SentenceFillAnswer).content.toLowerCase() &&
              o.correct
          )
          break
        case "SENTENCE_SELECT":
          isCorrect = question.options.some(
            (o) =>
              o.id === (answerData as SentenceSelectAnswer).optionId && o.correct
          )
          break
        case "IMAGE_DRAG_AND_DROP":
          isCorrect = Object.entries(
            (answerData as ImageDragAndDropAnswer).dragMap
          ).every(([droppableId, draggableId]) => droppableId === draggableId)
          break
      }
      if (isCorrect) sessionCorrect++
    }

    const existing = courseMap.get(session.courseId)
    if (!existing) {
      courseMap.set(session.courseId, {
        courseId: session.courseId,
        courseName,
        sessionCount: 1,
        totalCorrect: sessionCorrect,
        totalQuestions: guesses.length,
        lastAttempted: finishedAt,
      })
    } else {
      existing.sessionCount++
      existing.totalCorrect += sessionCorrect
      existing.totalQuestions += guesses.length
      if (finishedAt > existing.lastAttempted) existing.lastAttempted = finishedAt
    }
  }

  return Array.from(courseMap.values())
}

export type RawSessionStatRow = {
  sessionId: string
  finishedAt: Date
  origin: string
  totalCorrect: number
  totalQuestions: number
}

export const getCourseSessionStatsForUser = async (
  userId: User["id"],
  courseId: string
): Promise<{ courseName: string; sessions: RawSessionStatRow[] }> => {
  const allSessions = await db
    .selectFrom("gameSession")
    .selectAll("gameSession")
    .innerJoin("course", "gameSession.courseId", "course.id")
    .select(["course.name as courseName"])
    .where("gameSession.userId", "=", userId)
    .where("gameSession.courseId", "=", courseId)
    .where("gameSession.finishedAt", "is not", null)
    .orderBy("gameSession.finishedAt", "asc")
    .execute()

  if (allSessions.length === 0) return { courseName: "", sessions: [] }

  const courseName = (
    allSessions[0] as typeof allSessions[0] & { courseName: string }
  ).courseName
  const sessionIds = allSessions.map((s) => s.id)

  const allGuesses = (await db
    .selectFrom("guess")
    .selectAll()
    .where("gameSessionId", "in", sessionIds)
    .execute()) as Guess[]

  if (allGuesses.length === 0) {
    return {
      courseName,
      sessions: allSessions.map((s) => ({
        sessionId: s.id,
        finishedAt: s.finishedAt ?? new Date(),
        origin: s.origin,
        totalCorrect: 0,
        totalQuestions: 0,
      })),
    }
  }

  const questionIds = [...new Set(allGuesses.map((g) => g.questionId))]
  const questions = await getQuestionsWithOptionsIgnoreWeight(
    undefined,
    undefined,
    -1,
    false,
    questionIds
  )
  const questionsMap = new Map(questions.map((q) => [q.id, q]))

  const guessesBySession = new Map<string, Guess[]>()
  for (const guess of allGuesses) {
    const list = guessesBySession.get(guess.gameSessionId) ?? []
    list.push(guess)
    guessesBySession.set(guess.gameSessionId, list)
  }

  const sessions: RawSessionStatRow[] = []
  for (const session of allSessions) {
    const guesses = guessesBySession.get(session.id) ?? []
    let sessionCorrect = 0

    for (const guess of guesses) {
      const question = questionsMap.get(guess.questionId)
      if (!question) continue
      const answerData = guess.answerData
      let isCorrect = false

      switch (question.type) {
        case "MULTIPLE_CHOICE":
          isCorrect = question.options.some(
            (o) => o.id === (answerData as MultipleChoiceAnswer).optionId && o.correct
          )
          break
        case "MATRIX":
          isCorrect = (answerData as MatrixAnswer).optionIds.every((id) =>
            question.options.some((o) => o.id === id && o.correct)
          )
          break
        case "SENTENCE_FILL":
          isCorrect = question.options.some(
            (o) =>
              o.content.toLowerCase() ===
                (answerData as SentenceFillAnswer).content.toLowerCase() &&
              o.correct
          )
          break
        case "SENTENCE_SELECT":
          isCorrect = question.options.some(
            (o) =>
              o.id === (answerData as SentenceSelectAnswer).optionId && o.correct
          )
          break
        case "IMAGE_DRAG_AND_DROP":
          isCorrect = Object.entries(
            (answerData as ImageDragAndDropAnswer).dragMap
          ).every(([droppableId, draggableId]) => droppableId === draggableId)
          break
      }
      if (isCorrect) sessionCorrect++
    }

    sessions.push({
      sessionId: session.id,
      finishedAt: session.finishedAt ?? new Date(),
      origin: session.origin,
      totalCorrect: sessionCorrect,
      totalQuestions: guesses.length,
    })
  }

  return { courseName, sessions }
}
