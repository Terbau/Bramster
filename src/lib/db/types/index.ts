import type { Course } from "./course"
import type { GameSession, Guess } from "./game"
import type { Question, QuestionOption } from "./question"
import type { User } from "./user"

export interface Database {
  user: User
  course: Course
  question: Question
  questionOption: QuestionOption
  guess: Guess
  gameSession: GameSession
}
