"use client"

import { Breadcrumb } from "@/components/Breadcrumb"
import { CardButtonGroup } from "@/components/CardButtonGroup"
import { QuizGame } from "@/components/QuizGame/QuizGame"
import { Button } from "@/components/ui/button"
import { capitalized } from "@/lib/utils"
import type { GameSession } from "@/types/game"
import type { QuestionWithDetails } from "@/types/question"
import { useMutation } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { signIn, useSession } from "next-auth/react"
import { type FormEvent, useState, useEffect } from "react"

interface GameMutationResponse {
  gameSession: GameSession
  questions: QuestionWithDetails[]
}

const limitOptions = [
  {
    label: "10 questions",
    value: 10,
  },
  {
    label: "20 questions",
    value: 20,
  },
  {
    label: "30 questions",
    value: 30,
  },
  {
    label: "All questions",
    value: -1,
  },
]

const orderOptions = [
  {
    label: "Random order",
    value: "random",
  },
  {
    label: "Original order",
    value: "original",
  },
  {
    label: "Your worst questions",
    value: "worst",
  },
]

const defaultSettings = {
  limit: limitOptions[0].value,
  order: orderOptions[0].value,
}

export default function QuizPage({
  params,
}: { params: { id: string; origin: string } }) {
  const courseId = params.id
  const origin = decodeURIComponent(params.origin)
  const { data: session } = useSession()

  const handleLocalStorageLoad = (key: string) => {
    if (typeof window === "undefined") return defaultSettings

    const item = localStorage.getItem(key)
    if (item) {
      return JSON.parse(item)
    }

    return defaultSettings
  }

  const [settings, setSettings] = useState<{ limit: number; order: string }>(
    handleLocalStorageLoad("quiz-settings")
  )

  const { data, mutate, isPending } = useMutation<GameMutationResponse>({
    mutationKey: ["game", courseId, origin],
    mutationFn: () =>
      fetch(`/api/courses/${courseId}/game`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          origin,
          amountQuestions: settings.limit,
          order: settings.order,
        }),
      }).then((res) =>
        res.json().then((data: GameMutationResponse) => {
          for (const question of data.questions) {
            question.options = question.options.sort(() => Math.random() - 0.5)
          }
          return data
        })
      ),
  })

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    mutate()
  }

  useEffect(() => {
    localStorage.setItem("quiz-settings", JSON.stringify(settings))
  }, [settings])

  return (
    <div className="flex flex-col gap-y-4">
      <Breadcrumb
        links={[
          { label: "Courses", href: "/courses" },
          { label: courseId.toUpperCase(), href: `/courses/${courseId}` },
          {
            label: capitalized(origin),
            href: `/courses/${courseId}/${origin}`,
          },
        ]}
      />

      <h1 className="text-4xl font-bold">
        {courseId.toUpperCase()} - {capitalized(origin)}
      </h1>

      {!session && (
        <div className="space-y-2">
          <p>You need to sign in to take the quiz</p>
          <Button onClick={() => signIn("auth0")}>Sign in</Button>
        </div>
      )}

      {session && !data && (
        <form onSubmit={handleSubmit} className="space-y-10 mt-4">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Questions</h2>
            <CardButtonGroup
              cards={limitOptions}
              value={settings.limit}
              onChange={(value) =>
                setSettings({
                  ...settings,
                  limit: value,
                })
              }
            />
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Order</h2>
            <CardButtonGroup
              cards={orderOptions}
              value={settings.order}
              onChange={(value) =>
                setSettings({
                  ...settings,
                  order: value,
                })
              }
            />
          </div>

          <Button type="submit" size="xl" className="w-full">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Start quiz
          </Button>
        </form>
      )}

      {session && data && (
        <QuizGame questions={data.questions} gameSession={data.gameSession} />
      )}
    </div>
  )
}
