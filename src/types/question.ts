import { z } from "zod"

export const Question = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
  id: z.string(),
  courseId: z.string(),
  question: z.string(),
  origin: z.string(),
  label: z.string().nullable().optional(),
})

export type Question = z.infer<typeof Question>

export const QuestionCreate = Question.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export type QuestionCreate = z.infer<typeof QuestionCreate>

export const QuestionOption = z.object({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  questionId: z.string(),
  option: z.string(),
  correct: z.boolean(),
})

export type QuestionOption = z.infer<typeof QuestionOption>

export const QuestionOptionCreate = QuestionOption.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export type QuestionOptionCreate = z.infer<typeof QuestionOptionCreate>

export const QuestionWithOptions = Question.extend({
  options: z.array(QuestionOption),
  weight: z.number().nullable(),
})

export type QuestionWithOptions = z.infer<typeof QuestionWithOptions>
