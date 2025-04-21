import { cn, getPartByLocale } from "@/lib/utils"
import { createRef, type RefObject, useEffect, useRef, useState } from "react"
import Latex from "react-latex"
import type { GameTypeProps } from "../../QuizGame"
import { CircleCheck, CircleX } from "lucide-react"
import Image from "next/image"

export interface MultipleChoiceProps extends GameTypeProps {
  answeredIndex: number
  handleAnswer: (index: number) => void
}

export const MultipleChoice = ({
  question,
  showAnswer,
  navigateQuiz,
  handleAnswer,
  answeredIndex,
}: MultipleChoiceProps) => {
  const [currentHoveredOptionIndex, setCurrentHoveredOptionIndex] = useState(-1)
  const amountOptions = question.options.length

  const ref = useRef<RefObject<HTMLButtonElement>[]>(
    Array.from({ length: amountOptions }).map(() =>
      createRef<HTMLButtonElement>()
    )
  )

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      if (showAnswer) {
        navigateQuiz(true)
        return
      }
    }

    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault()

      setCurrentHoveredOptionIndex((prev) =>
        Math.min(
          Math.max(prev + (event.key === "ArrowUp" ? -1 : 1), 0),
          amountOptions - 1
        )
      )
      return
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault()

      navigateQuiz(event.key === "ArrowRight")
      return
    }

    const index = Number(event.key) - 1
    if (index >= 0 && index < question.options.length) {
      setCurrentHoveredOptionIndex(index)
    }
  }

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  // Effect that
  useEffect(() => {
    if (currentHoveredOptionIndex !== -1) {
      const index = currentHoveredOptionIndex
      if (index >= 0 && index < amountOptions) {
        const currentRef = ref.current[index].current
        currentRef?.focus()
      }
    }
  }, [currentHoveredOptionIndex, amountOptions])

  return (
    <div className="mt-4 flex flex-col gap-y-3 font-sans">
      {question.imagePath && (
        <Image
          src={`/uploads/${question.imagePath}`}
          alt="Question image"
          width={question.imageWidth ?? 0}
          height={question.imageHeight ?? 0}
          className="object-contain max-h-[16rem] w-fit"
        />
      )}
      {question.options.map((option, index) => (
        <button
          ref={ref.current[index]}
          type="button"
          key={option.id}
          onClick={() => handleAnswer(index)}
          className={cn(
            "py-3 px-4 border border-gray-300 rounded-lg flex flex-row justify-between items-center",
            {
              "bg-red-300": showAnswer && !option.correct,
              "bg-green-300": showAnswer && option.correct,
              "hover:bg-gray-100": !showAnswer,
            }
          )}
        >
          <span className="text-left">
            <Latex>{getPartByLocale(option.content, "nb_NO")}</Latex>
          </span>
          {answeredIndex === index &&
            (option.correct ? (
              <CircleCheck size={26} className="text-green-500" />
            ) : (
              <CircleX size={26} className="text-red-500" />
            ))}
        </button>
      ))}
    </div>
  )
}
