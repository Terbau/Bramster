import type { FC } from "react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp } from "lucide-react"

export interface SegmentState {
  answered: boolean
  correct?: boolean
}

interface SegmentedProgressProps {
  segments: SegmentState[]
  currentIndex: number
  className?: string
  onSegmentClick?: (index: number) => void
}

export const SegmentedProgress: FC<SegmentedProgressProps> = ({
  segments,
  currentIndex,
  className,
  onSegmentClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  // Show collapsed view by default if there are many segments
  const shouldShowCollapsed = segments.length > 20 && !isExpanded

  const getSegmentColor = (segment: SegmentState, index: number) => {
    const isCurrent = index === currentIndex

    if (!segment.answered) {
      return cn("bg-gray-200", isCurrent && "ring-2 ring-primary ring-offset-2")
    }

    if (segment.correct) {
      return cn(
        "bg-green-500",
        isCurrent && "ring-2 ring-primary ring-offset-2"
      )
    }

    return cn("bg-red-500", isCurrent && "ring-2 ring-primary ring-offset-2")
  }

  const amountCorrect = segments.filter((s) => s.answered && s.correct).length
  const amountIncorrect = segments.filter(
    (s) => s.answered && !s.correct
  ).length
  const amountAnswered = amountCorrect + amountIncorrect

  return (
    <div className={cn("w-full", className)}>
      {shouldShowCollapsed ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1">
              <div className="flex justify-between text-sm font-medium mb-1">
                <span>
                  Question {currentIndex + 1} of {segments.length}
                </span>
                <span className="text-gray-600">
                  {amountAnswered}/{segments.length} answered
                </span>
              </div>
              <div className="flex gap-1 h-3">
                {amountCorrect > 0 && (
                  <div
                    className="bg-green-500 rounded-full"
                    style={{ flex: `${amountCorrect} 0` }}
                    title={`${amountCorrect} correct`}
                  />
                )}
                {amountIncorrect > 0 && (
                  <div
                    className="bg-red-500 rounded-full"
                    style={{ flex: `${amountIncorrect} 0` }}
                    title={`${amountIncorrect} incorrect`}
                  />
                )}
                {segments.length - amountAnswered > 0 && (
                  <div
                    className="bg-gray-200 rounded-full"
                    style={{ flex: `${segments.length - amountAnswered} 0` }}
                    title={`${segments.length - amountAnswered} not answered`}
                  />
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Show all questions"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1">
              <div
                className="grid gap-1 w-full"
                style={{
                  gridTemplateColumns: "repeat(auto-fit, minmax(1rem, 1fr))",
                }}
              >
                {segments.map((segment, index) => (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                    key={index}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSegmentClick?.(index)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        onSegmentClick?.(index)
                      }
                    }}
                    className={cn(
                      "h-2 rounded-full transition-all duration-200 cursor-pointer",
                      getSegmentColor(segment, index)
                    )}
                    title={
                      index === currentIndex
                        ? `Question ${index + 1} (current)`
                        : `Question ${index + 1}${
                            segment.answered
                              ? segment.correct
                                ? " (correct)"
                                : " (incorrect)"
                              : " (not answered)"
                          }`
                    }
                  />
                ))}
              </div>
            </div>
            {segments.length > 20 && (
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                title="Collapse progress bar"
              >
                <ChevronUp className="h-5 w-5" />
              </button>
            )}
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>
              Question {currentIndex + 1} of {segments.length}
            </span>
            <span>
              {amountAnswered}/{segments.length} answered
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
