import type { Generated } from "kysely"

export interface QuestionSimilarity {
  id: Generated<string>
  createdAt: Generated<Date>
  questionId: string
  similarQuestionId: string
  similarity: number
}
