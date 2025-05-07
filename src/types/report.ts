import { z } from "zod"

export const QuestionErrorReportSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  questionId: z.string(),
  createdBy: z.string(),
  content: z.string(),
  status: z.enum(["OPEN", "RESOLVED"]).default("OPEN"),
  resolution: z.string().optional(),
  resolutionDate: z.date().optional(),
})

export type QuestionErrorReport = z.infer<typeof QuestionErrorReportSchema>

export const QuestionErrorReportCreateSchema = QuestionErrorReportSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export type QuestionErrorReportCreate = z.infer<
  typeof QuestionErrorReportCreateSchema
>

export const StrippedQuestionErrorReportCreateSchema =
  QuestionErrorReportCreateSchema.omit({
    createdBy: true,
    questionId: true,
  })

export type StrippedQuestionErrorReportCreate = z.infer<
  typeof StrippedQuestionErrorReportCreateSchema
>
