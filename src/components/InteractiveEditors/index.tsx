import type { QuestionOption, QuestionType } from "@/types/question"
import { InteractiveImageDragAndDropEditor } from "./InteractiveImageDragAndDropEditor"
import { InteractiveMatrixEditor } from "./InteractiveMatrixEditor"

export interface EditorQuestionOption extends QuestionOption {
  isNew: boolean
}

const INTERACTIVE_EDITORS: Partial<Record<QuestionType, string>> = {
  MULTIPLE_CHOICE: "Interactive Multiple Choice Editor",
  MATRIX: "Interactive Matrix Editor",
  IMAGE_DRAG_AND_DROP: "Interactive Image Drag And Drop Editor",
  SENTENCE_SELECT: "Interactive Sentence Select Editor",
  SENTENCE_FILL: "Interactive Sentence Fill In Editor",
} as const

export {
  INTERACTIVE_EDITORS,
  InteractiveMatrixEditor,
  InteractiveImageDragAndDropEditor,
}
