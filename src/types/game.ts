import { z } from "zod"
import { CourseSchema } from "./course"
import { QuestionWithDetailsSchema } from "./question"

export const GameSessionSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  userId: z.string(),
  amountQuestions: z.number(),
  origin: z.string(),
  courseId: z.string(),
  finishedAt: z.date().nullable().optional(),
})

export type GameSession = z.infer<typeof GameSessionSchema>

export const GameSessionCreateSchema = GameSessionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export type GameSessionCreate = z.infer<typeof GameSessionCreateSchema>

// Answer data types

export const MultipleChoiceAnswerSchema = z.object({
  optionId: z.string(),
})

export type MultipleChoiceAnswer = z.infer<typeof MultipleChoiceAnswerSchema>

export const MatrixAnswerSchema = z.object({
  optionIds: z.array(z.string()),
})

export type MatrixAnswer = z.infer<typeof MatrixAnswerSchema>

export const SentenceFillAnswerSchema = z.object({
  content: z.string(),
})

export type SentenceFillAnswer = z.infer<typeof SentenceFillAnswerSchema>

export const SentenceSelectAnswerSchema = z.object({
  optionId: z.string(),
})

export type SentenceSelectAnswer = z.infer<typeof SentenceSelectAnswerSchema>

export const ImageDragAndDropAnswerSchema = z.object({
  // key is the id of the droppable, value is the id of the draggable
  dragMap: z.record(z.string(), z.string()),
  amountCorrect: z.number(),
  amountIncorrect: z.number(),
})

export type ImageDragAndDropAnswer = z.infer<
  typeof ImageDragAndDropAnswerSchema
>

export const AnswerDataSchema = z.union([
  MultipleChoiceAnswerSchema,
  MatrixAnswerSchema,
  SentenceFillAnswerSchema,
  SentenceSelectAnswerSchema,
  ImageDragAndDropAnswerSchema,
])

export type AnswerData = z.infer<typeof AnswerDataSchema>

export const GuessSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  questionId: z.string(),
  gameSessionId: z.string(),
  answerData: AnswerDataSchema,
})

export type Guess = z.infer<typeof GuessSchema>

export const GuessCreateSchema = GuessSchema.omit({
  id: true,
  createdAt: true,
})

export type GuessCreate = z.infer<typeof GuessCreateSchema>

export const ExtendedGameSessionSchema = GameSessionSchema.extend({
  guessAmount: z.number(),
})

export type ExtendedGameSession = z.infer<typeof ExtendedGameSessionSchema>

export const ExtendedGameSessionWithResultsSchema =
  ExtendedGameSessionSchema.extend({
    amountCorrect: z.number(),
    amountIncorrect: z.number(),
    questions: z.array(QuestionWithDetailsSchema),
    guesses: z.array(GuessSchema),
    course: CourseSchema,
  })

export type ExtendedGameSessionWithResults = z.infer<
  typeof ExtendedGameSessionWithResultsSchema
>
