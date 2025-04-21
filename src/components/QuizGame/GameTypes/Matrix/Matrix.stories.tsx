import type { Meta, StoryObj } from "@storybook/react"

import { Matrix } from "./Matrix"
import { MATRIX_QUESTION } from "../../QuizGame.mockdata"

//👇 This default export determines where your story goes in the story list
const meta: Meta<typeof Matrix> = {
  component: Matrix,
  title: "GameTypes/Matrix",
}

export default meta
type Story = StoryObj<typeof Matrix>

export const Default: Story = {
  args: {
    question: MATRIX_QUESTION,
  },
}
