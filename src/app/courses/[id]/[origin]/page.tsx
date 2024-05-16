"use client"
import { Breadcrumb } from "@/components/Breadcrumb"
import { CardButtonGroup } from "@/components/CardButtonGroup"
import { QuizGame } from "@/components/QuizGame/QuizGame"
import { Button } from "@/components/ui/button"
import type { GameSession } from "@/types/game"
import type { QuestionWithOptions } from "@/types/question"
import { useMutation } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { signIn, useSession } from "next-auth/react"
import { type FormEvent, useState } from "react"

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
    value: false,
  },
  {
    label: "Original order",
    value: true,
  },
]

export default function QuizPage({
  params,
}: { params: { id: string; origin: string } }) {
  const courseId = params.id
  const origin = decodeURIComponent(params.origin)
  const { data: session } = useSession()

  const [settings, setSettings] = useState<{ limit: number; random: boolean }>({
    limit: limitOptions[0].value,
    random: false,
  })

  const { data, mutate, isPending } = useMutation<{
    gameSession: GameSession
    questions: QuestionWithOptions[]
  }>({
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
          random: settings.random,
        }),
      }).then((res) => res.json()),
  })
  // const { data, isLoading, refetch } = useQuery<QuestionWithOptions[]>({
  //   queryKey: ["questions", courseId, origin],
  //   queryFn: () =>
  //     fetch(
  //       `/api/courses/${courseId}/questions?origin=${origin}&limit=${settings.limit}&random=${settings.random}`
  //     ).then((res) => res.json()),
  //   enabled: false,
  // })

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    mutate()
  }

  return (
    <div className="space-y-4">
      <Breadcrumb
        links={[
          { label: "Courses", href: "/courses" },
          { label: courseId.toUpperCase(), href: `/courses/${courseId}` },
          { label: origin, href: `/courses/${courseId}/${origin}` },
        ]}
      />

      <h1 className="text-4xl font-bold">
        {courseId.toUpperCase()} - {origin}
      </h1>

      {!session && (
        <div className="space-y-2">
          <p>You need to sign in to take the quiz</p>
          <Button onClick={() => signIn("google")}>Sign in</Button>
        </div>
      )}

      {session && !data && (
        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">
              How many questions should the quiz include?
            </h2>
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
            <h2 className="text-2xl font-semibold">
              Should the questions come in a random order?
            </h2>
            <CardButtonGroup
              cards={orderOptions}
              value={settings.random}
              onChange={(value) =>
                setSettings({
                  ...settings,
                  random: value,
                })
              }
            />
          </div>

          <Button type="submit" size="lg">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Start quiz
          </Button>
        </form>
      )}

      {session && data && (
        <QuizGame
          questions={data.questions}
          gameSession={data.gameSession}
          session={session}
        />
      )}
    </div>
  )
}
