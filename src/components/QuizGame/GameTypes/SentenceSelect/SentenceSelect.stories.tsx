import type { Meta, StoryObj } from "@storybook/react"

import { SentenceSelect } from "./SentenceSelect"
import { SENTENCE_SELECT_OPTION } from "../../QuizGame.mockdata"

//👇 This default export determines where your story goes in the story list
const meta: Meta<typeof SentenceSelect> = {
  component: SentenceSelect,
  title: "GameTypes/SentenceSelect",
}

export default meta
type Story = StoryObj<typeof SentenceSelect>

export const Default: Story = {
  args: {
    question: SENTENCE_SELECT_OPTION,
  },
}
