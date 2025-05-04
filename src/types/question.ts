import { z } from "zod"

export const QuestionTypeSchema = z.enum([
  "MULTIPLE_CHOICE",
  "MATRIX",
  "SENTENCE_FILL",
  "SENTENCE_SELECT",
  "IMAGE_DRAG_AND_DROP",
])

export type QuestionType = z.infer<typeof QuestionTypeSchema>

export const QuestionSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
  id: z.string(),
  courseId: z.string(),
  content: z.string(), // May include {{placeholder}} for sentence fill and select
  subContent: z.string().nullable().optional(), // Only for SENTENCE_FILL and SENTENCE_SELECT
  imagePath: z.string().nullable().optional(),
  imageHeight: z.number().nullable().optional(),
  imageWidth: z.number().nullable().optional(),
  draggableWidth: z.number().nullable().optional(), // Only for IMAGE_DRAG_AND_DROP
  origin: z.string(),
  label: z.string().nullable().optional(),
  type: QuestionTypeSchema,
})

export type Question = z.infer<typeof QuestionSchema>

export const QuestionCreateSchema = QuestionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export type QuestionCreate = z.infer<typeof QuestionCreateSchema>

export const QuestionOptionSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  questionId: z.string(),
  correct: z.boolean(),
  content: z.string(),
  yContent: z.string().nullable().optional(), // Only for MATRIX
  xCoordinate: z.number().nullable().optional(), // Only for IMAGE_DRAG_AND_DROP
  yCoordinate: z.number().nullable().optional(), // Only for IMAGE_DRAG_AND_DROP
})

export type QuestionOption = z.infer<typeof QuestionOptionSchema>

export const QuestionOptionCreateSchema = QuestionOptionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  correct: true,
}).extend({
  correct: z.boolean().optional(),
})

export type QuestionOptionCreate = z.infer<typeof QuestionOptionCreateSchema>

export const QuestionWithOptionsSchema = QuestionSchema.extend({
  options: z.array(QuestionOptionSchema),
})

export type QuestionWithOptions = z.infer<typeof QuestionWithOptionsSchema>

export const QuestionWithOptionsCreateSchema = QuestionCreateSchema.extend({
  options: z.array(QuestionOptionCreateSchema),
})

export type QuestionWithOptionsCreate = z.infer<
  typeof QuestionWithOptionsCreateSchema
>

export const QuestionWithDetailsSchema = QuestionWithOptionsSchema.extend({
  weight: z.number().nullable(),
  allOrigins: z.array(z.string()).nullable(),
})

export type QuestionWithDetails = z.infer<typeof QuestionWithDetailsSchema>

export const QuestionWithDetailsCreateSchema = QuestionCreateSchema.extend({
  options: z.array(QuestionOptionCreateSchema),
})

export type QuestionWithDetailsCreate = z.infer<
  typeof QuestionWithDetailsCreateSchema
>

export const OriginDetailsSchema = z.object({
  origin: z.string(),
  totalQuestions: z.number(),
  label: z.string().nullable(),
})

export type OriginDetails = z.infer<typeof OriginDetailsSchema>
