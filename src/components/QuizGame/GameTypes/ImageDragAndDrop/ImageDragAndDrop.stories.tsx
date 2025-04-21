import type { Meta, StoryObj } from "@storybook/react"

import { ImageDragAndDrop } from "./ImageDragAndDrop"
import { IMAGE_DRAG_AND_DROP_QUESTION } from "../../QuizGame.mockdata"

//👇 This default export determines where your story goes in the story list
const meta: Meta<typeof ImageDragAndDrop> = {
  component: ImageDragAndDrop,
  title: "GameTypes/ImageDragAndDrop",
}

export default meta
type Story = StoryObj<typeof ImageDragAndDrop>

export const Default: Story = {
  args: {
    question: IMAGE_DRAG_AND_DROP_QUESTION,
  },
}
