import type {
  QuestionErrorReport,
  QuestionErrorReportCreate,
} from "@/types/report"
import { db } from "../db"

export const createQuestionErrorReport = async (
  report: QuestionErrorReportCreate
): Promise<QuestionErrorReport> => {
  const createdReport = await db
    .insertInto("questionErrorReport")
    .values(report)
    .returningAll()
    .executeTakeFirstOrThrow()

  return createdReport
}
