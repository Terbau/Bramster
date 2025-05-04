import type { QuestionWithDetails } from "@/types/question"
import { useCallback, useMemo, useState, type FC } from "react"
import { Progress } from "../Progress"
import Latex from "react-latex"
import { cn, compareOrigins, getPartByLocale } from "@/lib/utils"
import { Button } from "../ui/button"
import { CircleCheck, CircleX, Loader2 } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import type { AnswerData, GameSession, GuessCreate } from "@/types/game"
import { useRouter } from "next/navigation"
import { Badge } from "../ui/badge"
import { Tooltip } from "../Tooltip"
import { ImageDragAndDrop, MultipleChoice } from "./GameTypes"
import type { DroppedItems } from "./GameTypes/ImageDragAndDrop/ImageDragAndDrop"
import { Matrix } from "./GameTypes/Matrix/Matrix"
import { SentenceFill } from "./GameTypes/SentenceFill/SentenceFill"
import { SentenceSelect } from "./GameTypes/SentenceSelect/SentenceSelect"

export interface GameTypeProps {
  question: QuestionWithDetails
  showAnswer: boolean
  navigateQuiz: (isNext: boolean) => void
}

interface QuestionStateBase {
  showAnswer: boolean
  hasAnswered: boolean
}

interface MultipleChoiceQuestionState extends QuestionStateBase {
  answeredIndex: number
}

interface ImageDragAndDropQuestionState extends QuestionStateBase {
  droppedItems: DroppedItems
}

interface MatrixQuestionState extends QuestionStateBase {
  selectedOptionIds: string[]
}

interface SentenceFillQuestionState extends QuestionStateBase {
  answeredContent: string
}

interface SentenceSelectQuestionState extends QuestionStateBase {
  answeredOptionId: string
}

type QuestionState =
  | MultipleChoiceQuestionState
  | ImageDragAndDropQuestionState
  | MatrixQuestionState
  | SentenceFillQuestionState
  | SentenceSelectQuestionState

interface QuizGameProps {
  questions: QuestionWithDetails[]
  gameSession: GameSession
}

const weights = [-2, -1, 0, 2, 4]

const weightedDotDistribution = {
  [weights[0]]: {
    amount: 1,
    color: "text-red-500",
    tooltip: "This question is hard for you",
  },
  [weights[1]]: {
    amount: 2,
    color: "text-orange-500",
    tooltip: "This question is a bit hard for you",
  },
  [weights[2]]: {
    amount: 3,
    color: "text-gray-500",
    tooltip: "You are neutral to this question",
  },
  [weights[3]]: {
    amount: 4,
    color: "text-green-500",
    tooltip: "This question is a bit easy for you",
  },
  [weights[4]]: {
    amount: 5,
    color: "text-blue-500",
    tooltip: "This question is easy for you",
  },
} as const

export const QuizGame: FC<QuizGameProps> = ({ questions, gameSession }) => {
  const router = useRouter()
  const [lastGuessSyncSuccess, setLastGuessSyncSuccess] = useState<
    boolean | null
  >(null)
  let showLastGuessSyncSuccess: NodeJS.Timeout | null = null

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [syncedCount, setSyncedCount] = useState(0)
  const [questionStates, setQuestionStates] = useState<QuestionState[]>(
    questions.map((q) => {
      switch (q.type) {
        case "MULTIPLE_CHOICE":
          return {
            showAnswer: false,
            answeredIndex: -1,
          } as MultipleChoiceQuestionState
        case "MATRIX":
          return {
            showAnswer: false,
            selectedOptionIds: [] as string[],
          } as MatrixQuestionState
        case "SENTENCE_FILL":
          return {
            showAnswer: false,
            answeredContent: "",
          } as SentenceFillQuestionState
        case "SENTENCE_SELECT":
          return {
            showAnswer: false,
            answeredOptionId: "",
          } as SentenceSelectQuestionState
        case "IMAGE_DRAG_AND_DROP":
          return {
            showAnswer: false,
            droppedItems: {},
          } as ImageDragAndDropQuestionState
        default:
          return {
            showAnswer: false,
            answeredIndex: -1,
          } as MultipleChoiceQuestionState
      }
    })
  )

  const showAnswer = questionStates[currentQuestionIndex].showAnswer
  const currentQuestionState = questionStates[currentQuestionIndex]

  const amountQuestionsDone = currentQuestionIndex + 1
  const amountQuestions = questions.length
  const amountQuestionsAnswered = questionStates.filter(
    (questionState) => questionState.hasAnswered
  ).length

  const progress = (amountQuestionsAnswered / amountQuestions) * 100

  const currentQuestion = questions[currentQuestionIndex]

  const getWeightOption = (weight: number) => {
    // find the closest weight to the given weight, but only downwards (except if it matches exactly)
    const closestWeight = weights.reduce((prev, curr) =>
      Math.abs(curr - weight) < Math.abs(prev - weight) ? curr : prev
    )

    return weightedDotDistribution[closestWeight]
  }

  const navigateQuiz = useCallback(
    (forward = true) => {
      // setCurrentHoveredOptionIndex(-1)
      setCurrentQuestionIndex((prev) =>
        Math.min(Math.max(prev + (forward ? 1 : -1), 0), amountQuestions - 1)
      )
    },
    [amountQuestions]
  )

  const syncAnswer = (data: AnswerData) => {
    handleSetLastGuessSyncSuccess(null)
    addGuessMutate({
      questionId: currentQuestion.id,
      answerData: data,
      gameSessionId: gameSession.id,
    })
  }

  const handleMultipleChoiceAnswer = useCallback(
    (index: number) => {
      if (showAnswer) {
        navigateQuiz(true)
        return
      }

      setQuestionStates((prev) => {
        const newQuestionStates = [...prev]
        const state = newQuestionStates[
          currentQuestionIndex
        ] as MultipleChoiceQuestionState
        state.showAnswer = true
        state.hasAnswered = true
        state.answeredIndex = index

        return newQuestionStates
      })

      syncAnswer({
        optionId: currentQuestion.options[index].id,
      })
    },
    [
      syncAnswer,
      currentQuestionIndex,
      showAnswer,
      navigateQuiz,
      currentQuestion.options,
    ]
  )

  const handleImageDragAndDropAnswer = useCallback(
    (droppedItems: DroppedItems) => {
      if (showAnswer) {
        // navigateQuiz(true)
        return
      }

      setQuestionStates((prev) => {
        const newQuestionStates = [...prev]
        const state = newQuestionStates[
          currentQuestionIndex
        ] as ImageDragAndDropQuestionState
        state.showAnswer = true
        state.hasAnswered = true
        state.droppedItems = droppedItems

        return newQuestionStates
      })

      // Find this by comparing the key and value of the dropped items
      const amountCorrect = Object.entries(droppedItems).filter(
        ([key, value]) => key === value
      ).length
      const amountIncorrect =
        Object.entries(droppedItems).length - amountCorrect

      syncAnswer({ dragMap: droppedItems, amountCorrect, amountIncorrect })
    },
    [syncAnswer, currentQuestionIndex, showAnswer]
  )

  const handleMatrixAnswer = useCallback(
    (selectedOptionIds: string[]) => {
      if (showAnswer) {
        // navigateQuiz(true)
        return
      }

      setQuestionStates((prev) => {
        const newQuestionStates = [...prev]
        const state = newQuestionStates[
          currentQuestionIndex
        ] as MatrixQuestionState
        state.showAnswer = true
        state.hasAnswered = true
        state.selectedOptionIds = selectedOptionIds

        return newQuestionStates
      })

      syncAnswer({
        optionIds: selectedOptionIds,
      })
    },
    [syncAnswer, currentQuestionIndex, showAnswer]
  )

  const handleSentenceFillAnswer = useCallback(
    (content: string) => {
      if (showAnswer) {
        // navigateQuiz(true)
        return
      }

      setQuestionStates((prev) => {
        const newQuestionStates = [...prev]
        const state = newQuestionStates[
          currentQuestionIndex
        ] as SentenceFillQuestionState
        state.showAnswer = true
        state.hasAnswered = true
        state.answeredContent = content

        return newQuestionStates
      })
      syncAnswer({
        content,
      })
    },
    [syncAnswer, currentQuestionIndex, showAnswer]
  )

  const handleSentenceSelectAnswer = useCallback(
    (optionId: string) => {
      if (showAnswer) {
        // navigateQuiz(true)
        return
      }

      setQuestionStates((prev) => {
        const newQuestionStates = [...prev]
        const state = newQuestionStates[
          currentQuestionIndex
        ] as SentenceSelectQuestionState
        state.showAnswer = true
        state.hasAnswered = true
        state.answeredOptionId = optionId

        return newQuestionStates
      })
      syncAnswer({
        optionId,
      })
    },
    [syncAnswer, currentQuestionIndex, showAnswer]
  )

  const handleSetLastGuessSyncSuccess = (value: boolean | null) => {
    if (showLastGuessSyncSuccess) {
      clearTimeout(showLastGuessSyncSuccess)
    }

    if (value !== null) {
      showLastGuessSyncSuccess = setTimeout(() => {
        setLastGuessSyncSuccess(null)
      }, 2000)
    }

    setLastGuessSyncSuccess(value)
  }

  const { mutate: addGuessMutate, isPending: guessMutateIsPending } =
    useMutation({
      mutationKey: ["gameGuessAdd", gameSession.id, currentQuestion.id],
      mutationFn: (guess: GuessCreate) =>
        fetch(`/api/game/${gameSession.id}/guess`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(guess),
        }),
      onSuccess: () => {
        handleSetLastGuessSyncSuccess(true)
        setSyncedCount((prev) => prev + 1)
      },
      onError: () => {
        handleSetLastGuessSyncSuccess(false)
      },
    })

  const { mutate: finishMutate, isPending: finishIsLoading } = useMutation({
    mutationKey: ["gameFinish", gameSession.id],
    mutationFn: () =>
      fetch(`/api/game/${gameSession.id}/finish`, {
        method: "POST",
      }),
    onSuccess: () => {
      router.push(`/game/${gameSession.id}/results`)
    },
  })

  const getWeightElement = (weight: number) => {
    const weightOption = getWeightOption(weight)

    return (
      <Tooltip text={weightOption.tooltip}>
        <Badge variant="outline">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
              key={i}
              className={cn("text-gray-300", {
                [weightOption.color]: i <= weightOption.amount - 1,
              })}
            >
              •
            </span>
          ))}
        </Badge>
      </Tooltip>
    )
  }

  const getAllOriginsBadge = (allOrigins: string[]) => {
    allOrigins.sort((a, b) => compareOrigins(a, b))
    const text = `This question was present in the following exams: ${allOrigins.join(
      ", "
    )}`
    return (
      <Tooltip text={text}>
        <Badge variant="outline">Exams: {allOrigins.length}</Badge>
      </Tooltip>
    )
  }

  const currentQuestionElement = useMemo(() => {
    switch (currentQuestion.type) {
      case "MULTIPLE_CHOICE":
        return (
          <MultipleChoice
            question={currentQuestion}
            showAnswer={showAnswer}
            navigateQuiz={navigateQuiz}
            handleAnswer={handleMultipleChoiceAnswer}
            answeredIndex={
              (currentQuestionState as MultipleChoiceQuestionState)
                .answeredIndex
            }
          />
        )
      case "MATRIX":
        return (
          <Matrix
            question={currentQuestion}
            showAnswer={showAnswer}
            navigateQuiz={navigateQuiz}
            handleAnswer={handleMatrixAnswer}
            selectedOptionIds={
              (currentQuestionState as MatrixQuestionState).selectedOptionIds
            }
          />
        )
      case "SENTENCE_FILL":
        return (
          <SentenceFill
            question={currentQuestion}
            showAnswer={showAnswer}
            navigateQuiz={navigateQuiz}
            handleAnswer={handleSentenceFillAnswer}
            answeredContent={
              (currentQuestionState as SentenceFillQuestionState)
                .answeredContent
            }
          />
        )
      case "SENTENCE_SELECT":
        return (
          <SentenceSelect
            question={currentQuestion}
            showAnswer={showAnswer}
            navigateQuiz={navigateQuiz}
            handleAnswer={handleSentenceSelectAnswer}
            answeredOptionId={
              (currentQuestionState as SentenceSelectQuestionState)
                .answeredOptionId
            }
          />
        )
      case "IMAGE_DRAG_AND_DROP":
        return (
          <ImageDragAndDrop
            question={currentQuestion}
            showAnswer={showAnswer}
            navigateQuiz={navigateQuiz}
            handleAnswer={handleImageDragAndDropAnswer}
            answeredDroppedItems={
              (currentQuestionState as ImageDragAndDropQuestionState)
                .droppedItems
            }
          />
        )
      default:
        return null
    }
  }, [
    currentQuestion,
    showAnswer,
    navigateQuiz,
    handleMultipleChoiceAnswer,
    handleImageDragAndDropAnswer,
    handleMatrixAnswer,
    handleSentenceFillAnswer,
    handleSentenceSelectAnswer,
    currentQuestionState,
  ])

  return (
    <div>
      <Progress
        value={progress}
        preNumber={amountQuestionsDone}
        postNumber={amountQuestions}
      />

      <div className="mt-6 flex flex-row gap-x-2">
        {getWeightElement(currentQuestion.weight ?? 0)}
        {getAllOriginsBadge(currentQuestion.allOrigins ?? [])}
        <div className="flex flex-row gap-x-2 ml-auto items-center">
          {guessMutateIsPending && <Loader2 className="h-5 w-5 animate-spin" />}
          {lastGuessSyncSuccess !== null &&
            (lastGuessSyncSuccess ? (
              <CircleCheck className="h-5 w-5" />
            ) : (
              <CircleX className="text-red-500 h-5 w-5" />
            ))}
          {currentQuestion.label && (
            <Badge variant="outline">{currentQuestion.label}</Badge>
          )}
        </div>
      </div>
      <div className="mt-2">
        <h3 className="text-2xl font-semibold">
          <Latex>{getPartByLocale(currentQuestion.content, "nb_NO")}</Latex>
        </h3>
      </div>

      {currentQuestionElement}

      <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-between">
        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-x-2 w-full">
          <Button
            onClick={() => navigateQuiz(false)}
            className="w-full sm:w-28"
          >
            Previous
          </Button>
          <Button onClick={() => navigateQuiz(true)} className="w-full sm:w-28">
            Next
          </Button>
        </div>
        {amountQuestionsAnswered === amountQuestions &&
          syncedCount === amountQuestions && (
            <Button onClick={() => finishMutate()} className="w-full sm:w-32">
              {finishIsLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Finish
            </Button>
          )}
      </div>
    </div>
  )
}
