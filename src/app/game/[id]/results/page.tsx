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
import type {
  ExtendedGameSessionWithResults,
  Guess,
  ImageDragAndDropAnswer,
  MatrixAnswer,
  MultipleChoiceAnswer,
  SentenceFillAnswer,
  SentenceSelectAnswer,
} from "@/types/game"
import type { QuestionWithOptions } from "@/types/question"
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

  const findOption = (question: QuestionWithOptions, guess: Guess) => {
    switch (question.type) {
      case "MULTIPLE_CHOICE":
        return question.options.find(
          (option) =>
            option.id === (guess.answerData as MultipleChoiceAnswer).optionId
        )
      case "MATRIX":
        return question.options.find((option) =>
          (guess.answerData as MatrixAnswer).optionIds.includes(option.id)
        )
      case "SENTENCE_FILL":
        return question.options.find(
          (option) =>
            option.content.toLowerCase() ===
            (guess.answerData as SentenceFillAnswer).content.toLowerCase()
        )
      case "SENTENCE_SELECT":
        return question.options.find(
          (option) =>
            option.id === (guess.answerData as SentenceSelectAnswer).optionId
        )
      case "IMAGE_DRAG_AND_DROP":
        return question.options.find((option) => {
          const dragMap = (guess.answerData as ImageDragAndDropAnswer).dragMap
          return Object.values(dragMap).includes(option.id)
        })
      default:
        return undefined
    }
  }

  return (
    <div className="flex flex-col gap-y-4">
      <Breadcrumb
        links={[
          { label: "Courses", href: "/courses" },
          {
            label: data.course.id,
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

            if (!guess) {
              return null
            }

            let yourGuessText = ""
            let correctOptionText = ""
            let wasCorrect = false

            switch (question.type) {
              case "MULTIPLE_CHOICE": {
                const guessOption = findOption(question, guess)
                const correctOption = question.options.find(
                  (option) => option.correct
                )
                yourGuessText = guessOption?.content ?? ""
                correctOptionText = correctOption?.content ?? ""
                wasCorrect = guessOption?.correct ?? false
                break
              }
              case "MATRIX": {
                const guessSet = new Set(
                  (guess.answerData as MatrixAnswer).optionIds
                )
                const correctSet = new Set(
                  question.options
                    .filter((option) => option.correct)
                    .map((option) => option.id)
                )
                const exclusiveToGuess = guessSet.difference(correctSet)
                const exclusiveToCorrect = correctSet.difference(guessSet)

                yourGuessText = `${correctSet.size - exclusiveToGuess.size}/${
                  correctSet.size
                } correct`
                correctOptionText = yourGuessText
                wasCorrect =
                  guessSet.size === correctSet.size &&
                  guessSet.isSubsetOf(correctSet)
                break
              }
              case "SENTENCE_FILL": {
                yourGuessText = (guess.answerData as SentenceFillAnswer).content
                correctOptionText = question.options
                  .filter((option) => option.correct)
                  .map((option) => option.content)
                  .join(", ")
                wasCorrect = question.options.some(
                  (option) =>
                    option.content.toLowerCase() ===
                      (
                        guess.answerData as SentenceFillAnswer
                      ).content.toLowerCase() && option.correct
                )
                break
              }
              case "SENTENCE_SELECT": {
                const guessOption = findOption(question, guess)
                const correctOption = question.options.find(
                  (option) => option.correct
                )
                yourGuessText = guessOption?.content ?? ""
                correctOptionText = correctOption?.content ?? ""
                wasCorrect = guessOption?.correct ?? false
                break
              }
              case "IMAGE_DRAG_AND_DROP": {
                const guesses = Object.entries(
                  (guess.answerData as ImageDragAndDropAnswer).dragMap
                ).map(([droppableId, draggableId]) => [
                  question.options.find((option) => option.id === draggableId)
                    ?.content,
                  question.options.find((option) => option.id === droppableId)
                    ?.content,
                ])
                yourGuessText = guesses
                  .map((strings) => strings.join(" -> "))
                  .join(", ")
                wasCorrect = guesses.every(
                  ([draggableId, droppableId]) => draggableId === droppableId
                )
                break
              }
            }

            return (
              <TableRow key={question.id} className="h-full text-xs sm:text-sm">
                <TableCell>
                  <Latex>{getPartByLocale(question.content, "nb_NO")}</Latex>
                </TableCell>
                <TableCell>
                  <Latex>{getPartByLocale(yourGuessText, "nb_NO")}</Latex>
                </TableCell>
                <TableCell>
                  <Latex>{getPartByLocale(correctOptionText, "nb_NO")}</Latex>
                </TableCell>
                <TableCell className="h-full">
                  {wasCorrect ? (
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
