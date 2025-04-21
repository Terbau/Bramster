import type { Meta, StoryObj } from "@storybook/react"

import { MultipleChoice } from "./MultipleChoice"
import { MULTIPLE_CHOICE_QUESTION } from "../../QuizGame.mockdata"

//👇 This default export determines where your story goes in the story list
const meta: Meta<typeof MultipleChoice> = {
  component: MultipleChoice,
  title: "GameTypes/MultipleChoice",
}

export default meta
type Story = StoryObj<typeof MultipleChoice>

export const Default: Story = {
  args: {
    question: MULTIPLE_CHOICE_QUESTION,
  },
}
