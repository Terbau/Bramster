import type { Generated } from "kysely"

export interface GameSession {
  id: Generated<string>
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
  userId: string
  amountQuestions: number
  origin: string
  courseId: string
  finishedAt: Date | null
}

export interface Guess {
  id: Generated<string>
  createdAt: Generated<Date>
  questionId: string
  // optionId: string
  gameSessionId: string
  answerData: unknown
}