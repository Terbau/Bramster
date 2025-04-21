import type { Meta, StoryObj } from "@storybook/react"
import { TextInput } from "./TextInput"


//👇 This default export determines where your story goes in the story list
const meta: Meta<typeof TextInput> = {
  component: TextInput,
  title: "Input/TextInput",
}

export default meta
type Story = StoryObj<typeof TextInput>

export const Default: Story = {
  args: {

  },
}
