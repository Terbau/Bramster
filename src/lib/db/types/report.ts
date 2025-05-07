import type { Generated } from "kysely"

export interface QuestionErrorReport {
  id: Generated<string>
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
  questionId: string
  createdBy: string
  content: string
  status: "OPEN" | "RESOLVED"
  resolution?: string
  resolutionDate?: Date
}
