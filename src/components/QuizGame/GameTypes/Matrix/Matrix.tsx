import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { GameTypeProps } from "../../QuizGame"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { HorizontalScrollArea } from "@/components/HorizontalScrollArea/HorizontalScrollArea"

interface MatrixProps extends GameTypeProps {
  selectedOptionIds?: string[]
  handleAnswer: (selectedOptionsIds: string[]) => void
}

export const Matrix = ({
  question,
  showAnswer,
  navigateQuiz,
  selectedOptionIds: preSelectedOptionIds = [],
  handleAnswer,
}: MatrixProps) => {
  const hasAnswered = preSelectedOptionIds.length > 0 // This means that the user has already answered
  const viewportRef = useRef<HTMLDivElement>(null)

  const xArray = useMemo(() => {
    return Array.from(
      new Set<string>(question.options.map((option) => option.content))
    )
  }, [question.options])
  const yArray = useMemo(() => {
    return Array.from(
      new Set<string>(question.options.map((option) => option.yContent ?? ""))
    )
  }, [question.options])

  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>(() =>
    Array.from({ length: yArray.length }, () => "")
  )

  const [existsDimArray, answerDimArray] = useMemo(() => {
    const xLen = xArray.length
    const yLen = yArray.length

    const arrExists: boolean[][] = Array.from({ length: yLen }, () =>
      Array.from({ length: xLen }, () => false)
    )
    const arrAnswer: boolean[][] = Array.from({ length: yLen }, () =>
      Array.from({ length: xLen }, () => false)
    )

    // Fill every spot with true if the option is present
    for (const option of question.options) {
      const xIndex = xArray.indexOf(option.content)
      const yIndex = yArray.indexOf(option.yContent ?? "")
      arrExists[yIndex][xIndex] = true
      arrAnswer[yIndex][xIndex] = option.correct
    }

    return [arrExists, arrAnswer]
  }, [question.options, xArray, yArray])

  const handleValueChange = (yIndex: number, value: string) => {
    const selectedOptionId = question.options.find((o) => o.id === value)
    if (!selectedOptionId) {
      throw new Error("Selected option not found")
    }

    setSelectedOptionIds((prev) => {
      const newSelectedOptionIds = [...prev]
      newSelectedOptionIds[yIndex] = value
      return newSelectedOptionIds
    })
  }

  useEffect(() => {
    // All spots must be filled
    if (selectedOptionIds.every((id) => id !== "")) {
      handleAnswer(selectedOptionIds)
    }
  })

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
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
    },
    [navigateQuiz, showAnswer]
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="w-fit mt-4">
      {question.imagePath && (
        <Image
          src={`/uploads/${question.imagePath}`}
          alt="Question image"
          width={question.imageWidth ?? 0}
          height={question.imageHeight ?? 0}
          className="object-contain max-h-[16rem] w-fit mb-4"
        />
      )}
      <HorizontalScrollArea className="w-[90vw] mx-auto">
        <table className="border-collapse table-auto">
          <thead>
            <tr>
              <th className="text-center" />
              {xArray.map((x, xIndex) => (
                <th
                  key={`x-${xIndex + 1}`}
                  className="text-xs sm:text-base text-center font-normal pb-1 px-2 max-w-64"
                >
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {yArray.map((_, yIndex) => (
              <RadioGroup
                asChild
                key={`y-${yIndex + 1}`}
                className="table-row"
                onValueChange={(value) => handleValueChange(yIndex, value)}
                disabled={hasAnswered}
                defaultValue={preSelectedOptionIds[yIndex] ?? ""}
              >
                <tr>
                  <td className="text-xs sm:text-base text-center pr-2 max-w-32 sm:max-w-64">
                    {yArray[yIndex]}
                  </td>
                  {xArray.map((_, xIndex) => {
                    const option = question.options.find(
                      (o) =>
                        o.content === xArray[xIndex] &&
                        o.yContent === yArray[yIndex]
                    )

                    return (
                      <td
                        key={`x-radio-${xIndex + 1}`}
                        className={cn(
                          "h-10 w-10 sm:h-12 sm:w-12 border border-slate-400 text-center scale-75 md:scale-100",
                          {
                            "bg-green-200":
                              showAnswer && answerDimArray[yIndex][xIndex],
                            "bg-red-200":
                              showAnswer &&
                              !answerDimArray[yIndex][xIndex] &&
                              (selectedOptionIds[yIndex] === option?.id ||
                                preSelectedOptionIds[yIndex] === option?.id),
                          }
                        )}
                      >
                        {existsDimArray[yIndex][xIndex] ? (
                          <label
                            className={cn(
                              "w-full h-full flex items-center justify-center",
                              { "cursor-pointer": !hasAnswered }
                            )}
                          >
                            <RadioGroupItem
                              value={option?.id ?? ""}
                              className={cn({
                                "cursor-pointer": !hasAnswered,
                              })}
                            />
                          </label>
                        ) : (
                          <span>X</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              </RadioGroup>
            ))}
          </tbody>
        </table>
      </HorizontalScrollArea>
    </div>
  )
}
