import type { QuestionOption } from "@/types/question"
import { InteractiveImageDragAndDropEditor } from "./InteractiveImageDragAndDropEditor"
import { InteractiveMatrixEditor } from "./InteractiveMatrixEditor"

export interface EditorQuestionOption extends QuestionOption {
  isNew: boolean
}

export { InteractiveMatrixEditor, InteractiveImageDragAndDropEditor }
