import { z } from "zod"

export const GameSession = z.object({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  userId: z.string(),
  amountQuestions: z.number(),
  finishedAt: z.date().nullable().optional(),
})

export type GameSession = z.infer<typeof GameSession>

export const GameSessionCreate = GameSession.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export type GameSessionCreate = z.infer<typeof GameSessionCreate>

export const Guess = z.object({
  id: z.string(),
  createdAt: z.date(),
  questionId: z.string(),
  optionId: z.string(),
  gameSessionId: z.string(),
})

export type Guess = z.infer<typeof Guess>

export const GuessCreate = Guess.omit({
  id: true,
  createdAt: true,
})

export type GuessCreate = z.infer<typeof GuessCreate>

export const ExtendedGameSession = GameSession.extend({
  guessAmount: z.number(),
})

export type ExtendedGameSession = z.infer<typeof ExtendedGameSession>
