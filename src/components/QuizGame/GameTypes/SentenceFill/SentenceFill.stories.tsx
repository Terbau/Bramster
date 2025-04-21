import type { Meta, StoryObj } from "@storybook/react"

import { SentenceFill } from "./SentenceFill"
import { SENTENCE_FILL_QUESTION } from "../../QuizGame.mockdata"

//👇 This default export determines where your story goes in the story list
const meta: Meta<typeof SentenceFill> = {
  component: SentenceFill,
  title: "GameTypes/SentenceFill",
}

export default meta
type Story = StoryObj<typeof SentenceFill>

export const Default: Story = {
  args: {
    question: SENTENCE_FILL_QUESTION,
  },
}
