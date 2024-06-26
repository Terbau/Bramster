"use client"

import { Breadcrumb } from "@/components/Breadcrumb"
import { Spinner } from "@/components/Spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { asReadbleTime, capitalized, getPartByLocale } from "@/lib/utils"
import type { ExtendedGameSessionWithResults } from "@/types/game"
import { useQuery } from "@tanstack/react-query"
import { CircleCheck, CircleX } from "lucide-react"
import { useSession } from "next-auth/react"
import Latex from "react-latex"

export default function GameResultsPage({
  params,
}: { params: { id: string } }) {
  const { data: session } = useSession()

  const { data, isLoading } = useQuery<ExtendedGameSessionWithResults>({
    queryKey: ["gameResults", params.id],
    queryFn: () =>
      fetch(`/api/game/${params.id}/results`).then((res) => res.json()),
    enabled: !!session,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <Spinner />
      </div>
    )
  }

  if (!data) {
    return <div>Game session not found</div>
  }

  const answersMap = new Map(
    data.guesses.map((guess) => [guess.questionId, guess])
  )

  const fields = [{ label: "Started at", value: asReadbleTime(data.createdAt) }]

  if (data.finishedAt) {
    fields.push({ label: "Finished at", value: asReadbleTime(data.finishedAt) })
  }

  return (
    <div className="flex flex-col gap-y-4">
      <Breadcrumb
        links={[
          { label: "Courses", href: "/courses" },
          {
            label: data.course.id.toUpperCase(),
            href: `/courses/${data.course.id}`,
          },
          {
            label: capitalized(data.origin),
            href: `/courses/${data.course.id}/${data.origin}`,
          },
          { label: "Results", href: `/game/${params.id}/results` },
        ]}
      />
      <div className="flex flex-col-reverse gap-y-4 sm:flex-row justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Quiz results</h1>
          <p className="text-gray-800 ml-1">
            {data.course.name} - {data.origin}
          </p>
        </div>

        <div className="border border-gray-200 rounded-sm flex flex-col p-3 sm:w-fit">
          {fields.map((field) => (
            <div key={field.label} className="flex flex-row gap-x-2">
              <span className="font-semibold">{field.label}:</span>
              <span>{field.value}</span>
            </div>
          ))}
        </div>
      </div>

      <Table className="mt-2 sm:mt-8">
        <TableHeader>
          <TableRow className="text-xs sm:text-sm">
            <TableHead>Question</TableHead>
            <TableHead>Your guess</TableHead>
            <TableHead>Correct option</TableHead>
            <TableHead className="whitespace-nowrap">Was correct</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.questions.map((question) => {
            const guess = answersMap.get(question.id)
            const guessOption = question.options.find(
              (option) => option.id === guess?.optionId
            )
            const correctOption = question.options.find(
              (option) => option.correct
            )

            if (
              guess === undefined ||
              guessOption === undefined ||
              correctOption === undefined
            ) {
              return null
            }

            return (
              <TableRow key={question.id} className="h-full text-xs sm:text-sm">
                <TableCell>
                  <Latex>{getPartByLocale(question.question, "nb_NO")}</Latex>
                </TableCell>
                <TableCell>
                  <Latex>{getPartByLocale(guessOption.option, "nb_NO")}</Latex>
                </TableCell>
                <TableCell>
                  <Latex>
                    {getPartByLocale(correctOption.option, "nb_NO")}
                  </Latex>
                </TableCell>
                <TableCell className="h-full">
                  {guessOption.correct ? (
                    <CircleCheck size={26} className="text-green-500" />
                  ) : (
                    <CircleX size={26} className="text-red-500" />
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={4}>
              Total score: {data.amountCorrect}/{data.questions.length}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}
