import type {
  ExtendedGameSession,
  GameSession,
  GameSessionCreate,
  Guess,
  GuessCreate,
} from "@/types/game"
import { db } from "../db"
import type { Question } from "@/types/question"

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
