import type { Meta, StoryObj } from "@storybook/react"

import { QuizGame } from "./QuizGame"
import {
  GAME_SESSION,
  IMAGE_DRAG_AND_DROP_QUESTION,
  MATRIX_QUESTION,
  MULTIPLE_CHOICE_QUESTION,
  QUESTIONS,
  SENTENCE_FILL_QUESTION,
  SENTENCE_SELECT_OPTION,
} from "./QuizGame.mockdata"

//👇 This default export determines where your story goes in the story list
const meta: Meta<typeof QuizGame> = {
  component: QuizGame,
  title: "QuizGame",
}

export default meta
type Story = StoryObj<typeof QuizGame>

export const Default: Story = {
  args: {
    gameSession: GAME_SESSION,
    questions: QUESTIONS,
  },
}

export const MultipleChoice: Story = {
  args: {
    gameSession: GAME_SESSION,
    questions: [MULTIPLE_CHOICE_QUESTION],
  },
}

export const ImageDragAndDrop: Story = {
  args: {
    gameSession: GAME_SESSION,
    questions: [IMAGE_DRAG_AND_DROP_QUESTION],
  },
}

export const Matrix: Story = {
  args: {
    gameSession: GAME_SESSION,
    questions: [MATRIX_QUESTION],
  },
}

export const SentenceFill: Story = {
  args: {
    gameSession: GAME_SESSION,
    questions: [SENTENCE_FILL_QUESTION],
  },
}

export const SentenceSelect: Story = {
  args: {
    gameSession: GAME_SESSION,
    questions: [SENTENCE_SELECT_OPTION],
  },
}
