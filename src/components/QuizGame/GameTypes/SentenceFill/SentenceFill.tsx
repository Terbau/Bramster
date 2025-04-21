import { Input } from "@/components/ui/input"
import type { GameTypeProps } from "../../QuizGame"
import { cn } from "@/lib/utils"
import { useEffect, useMemo, useState } from "react"
import { Icon } from "@iconify/react/dist/iconify.js"
import Image from "next/image"

interface SentenceFillProps extends GameTypeProps {
  answeredContent?: string
  handleAnswer: (content: string) => void
}

export const SentenceFill = ({
  question,
  showAnswer,
  navigateQuiz,
  answeredContent = "",
  handleAnswer,
}: SentenceFillProps) => {
  const [inputValue, setInputValue] = useState("")

  if (!question.subContent) {
    throw new Error("Question subContent must be defined")
  }

  const questionParts = question.subContent.split("{{placeholder}}")

  if (questionParts.length !== 2) {
    throw new Error("Question content must have exactly one placeholder")
  }

  const correctAnswers = useMemo(
    () =>
      question.options
        .filter((option) => option.correct)
        .map((option) => option.content),
    [question.options]
  )
  const inputContentToUse =
    answeredContent !== "" ? answeredContent : inputValue
  const isCorrect = useMemo(() => {
    const normalizedInput = inputContentToUse.trim().toLowerCase()
    return correctAnswers.some(
      (answer) => answer.trim().toLowerCase() === normalizedInput
    )
  }, [inputContentToUse, correctAnswers])

  const handleAnswerClick = () => {
    if (inputValue === "") return
    if (showAnswer) return

    handleAnswer(inputValue)
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      if (showAnswer) {
        navigateQuiz(true)
        return
      }
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault()

      navigateQuiz(event.key === "ArrowRight")
      return
    }
  }

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="mt-6 mb-8">
      {question.imagePath && (
        <Image
          src={`/uploads/${question.imagePath}`}
          alt="Question image"
          width={question.imageWidth ?? 0}
          height={question.imageHeight ?? 0}
          className="object-contain max-h-[16rem] w-fit"
        />
      )}
      <p className="inline">
        {questionParts[0]}
        <span className="relative inline-block">
          <span className="flex flex-row items-center">
            <Input
              className={cn(
                "w-fit disabled:opacity-80 border-r-0 rounded-r-none focus-visible:ring-offset-0 focus-visible:z-10",
                {
                  "bg-green-100 border-green-300": showAnswer && isCorrect,
                },
                {
                  "bg-red-100 border-red-300": showAnswer && !isCorrect,
                }
              )}
              onChange={(e) => setInputValue(e.target.value)}
              value={inputContentToUse}
              disabled={showAnswer}
            />
            <button
              type="button"
              className={cn(
                "flex w-10 h-10 items-center justify-center border border-slate-200 rounded-r-sm",
                "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "disabled:opacity-75 disabled:cursor-not-allowed",
                { "bg-green-100 border-green-300": showAnswer && isCorrect },
                { "bg-red-100 border-red-300": showAnswer && !isCorrect }
              )}
              disabled={showAnswer}
              onClick={handleAnswerClick}
            >
              <Icon icon="mdi:check" className="text-slate-500" />
            </button>
          </span>
          {showAnswer && (
            <span
              className={cn(
                "absolute -top-5 text-center text-xs whitespace-nowrap -translate-x-1/2 left-1/2",
                {
                  "text-green-500": isCorrect,
                  "text-red-500": !isCorrect,
                }
              )}
            >
              {`(${correctAnswers.join(", ")})`}
            </span>
          )}
        </span>
        {questionParts[1]}
      </p>
    </div>
  )
}
