import "../src/app/globals.css"
import type { Preview } from "@storybook/react"
import { Inter as FontSans } from "next/font/google"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const queryClient = new QueryClient()

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    nextjs: {
      appDirectory: true,
    }
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className={`font-sans ${fontSans.variable}`}>
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
}

export default preview
