import type { GameTypeProps } from "../../QuizGame"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useEffect } from "react"
import Image from "next/image"

interface SentenceSelectProps extends GameTypeProps {
  answeredOptionId?: string
  handleAnswer: (optionId: string) => void
}

export const SentenceSelect = ({
  question,
  showAnswer,
  navigateQuiz,
  answeredOptionId = "",
  handleAnswer,
}: SentenceSelectProps) => {
  if (!question.subContent) {
    throw new Error("Question subContent must be defined")
  }

  const questionParts = question.subContent.split("{{placeholder}}")

  if (questionParts.length !== 2) {
    throw new Error("Question content must have exactly one placeholder")
  }

  const correctAnswers = question.options
    .filter((option) => option.correct)
    .map((option) => option.content)
  const isCorrect =
    question.options.find((option) => option.id === answeredOptionId)
      ?.correct ?? false

  const selectedOption = question.options.find(
    (option) => option.id === answeredOptionId
  )
  const selectedText = selectedOption ? selectedOption.content : "Velg"
  const minWidth = Math.max(80, selectedText.length * 10 + 10)

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
        <span
          className="relative inline-block"
          style={{ width: `${minWidth}px`, verticalAlign: "middle" }}
        >
          <Select
            onValueChange={handleAnswer}
            disabled={showAnswer}
            value={answeredOptionId !== "" ? answeredOptionId : undefined}
          >
            <SelectTrigger
              className={cn(
                "focus:ring-offset-0 disabled:opacity-75 w-full",
                { "bg-green-100 border-green-300": showAnswer && isCorrect },
                { "bg-red-100 border-red-300": showAnswer && !isCorrect }
              )}
            >
              <SelectValue placeholder="Velg" />
            </SelectTrigger>
            <SelectContent>
              {question.options.map((option) => (
                <SelectItem
                  className='font-[ui-sans-serif,system-ui,sans-serif,"Apple_Color_Emoji","Segoe_UI_Emoji","Segoe_UI_Symbol","Noto_Color_Emoji"]'
                  key={option.id}
                  value={option.id}
                >
                  {option.content}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
