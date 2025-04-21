import type { Generated } from "kysely"

export interface Question {
  id: Generated<string>
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
  courseId: string
  content: string
  subContent: string | null
  imagePath: string | null
  imageHeight: number | null // Only for IMAGE_DRAG_AND_DROP
  imageWidth: number | null // Only for IMAGE_DRAG_AND_DROP
  draggableWidth: number | null // Only for IMAGE_DRAG_AND_DROP
  origin: string
  label: string | null
  type:
    | "MULTIPLE_CHOICE"
    | "MATRIX"
    | "SENTENCE_FILL"
    | "SENTENCE_SELECT"
    | "IMAGE_DRAG_AND_DROP"
}

export interface QuestionOption {
  id: Generated<string>
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
  questionId: string
  content: string
  yContent: string | null // Only for MATRIX
  xCoordinate: number | null // Only for IMAGE_DRAG_AND_DROP
  yCoordinate: number | null // Only for IMAGE_DRAG_AND_DROP
  correct: boolean
}
