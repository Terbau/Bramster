import type { Generated } from "kysely"

export interface Question {
  id: Generated<string>
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
  courseId: string
  question: string
  origin: string
}

export interface QuestionOption {
  id: Generated<string>
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
  questionId: string
  option: string
  correct: boolean
}
