import type { QuestionWithOptions } from "@/types/question"
import {
  type RefObject,
  useRef,
  useState,
  type FC,
  createRef,
  useEffect,
} from "react"
import { Progress } from "../Progress"
import Latex from "react-latex"
import { cn, compareOrigins, getPartByLocale } from "@/lib/utils"
import { Button } from "../ui/button"
import { CircleCheck, CircleX, Loader2 } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import type { GameSession, GuessCreate } from "@/types/game"
import { useRouter } from "next/navigation"
import { Badge } from "../ui/badge"
import { Tooltip } from "../Tooltip"

interface QuizGameProps {
  questions: QuestionWithOptions[]
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

  // Find the question with the most options
  const maxOptions = questions.reduce((max, question) => {
    return Math.max(max, question.options.length)
  }, 0)

  const ref = useRef<RefObject<HTMLButtonElement>[]>(
    Array.from({ length: maxOptions }).map(() => createRef<HTMLButtonElement>())
  )
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [currentHoveredOptionIndex, setCurrentHoveredOptionIndex] = useState(-1)
  const [syncedCount, setSyncedCount] = useState(0)
  const [questionStates, setQuestionStates] = useState<
    { showAnswer: boolean; answeredIndex: number }[]
  >(
    questions.map(() => ({
      showAnswer: false,
      answeredIndex: -1,
    }))
  )

  const showAnswer = questionStates[currentQuestionIndex].showAnswer
  const answeredIndex = questionStates[currentQuestionIndex].answeredIndex

  const amountQuestionsDone = currentQuestionIndex + 1
  const amountQuestions = questions.length
  const amountQuestionsAnswered = questionStates.filter(
    (questionState) => questionState.answeredIndex !== -1
  ).length

  const progress = (amountQuestionsAnswered / amountQuestions) * 100

  const currentQuestion = questions[currentQuestionIndex]
  const currentOptionsLength = currentQuestion.options.length

  const getWeightOption = (weight: number) => {
    // find the closest weight to the given weight, but only downwards (except if it matches exactly)
    const closestWeight = weights.reduce((prev, curr) =>
      Math.abs(curr - weight) < Math.abs(prev - weight) ? curr : prev
    )

    return weightedDotDistribution[closestWeight]
  }

  const handleOptionClick = (index: number) => {
    if (showAnswer) {
      navigateQuiz(true)
      return
    }

    setQuestionStates((prev) => {
      const newQuestionStates = [...prev]
      newQuestionStates[currentQuestionIndex].showAnswer = true
      newQuestionStates[currentQuestionIndex].answeredIndex = index
      return newQuestionStates
    })

    handleSetLastGuessSyncSuccess(null)
    addGuessMutate({
      questionId: currentQuestion.id,
      optionId: currentQuestion.options[index].id,
      gameSessionId: gameSession.id,
    })

    if (currentQuestion.options[index].correct) {
      console.log("Correct!")
    } else {
      console.log("Incorrect!")
    }
  }

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
          currentOptionsLength - 1
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
    if (index >= 0 && index < currentQuestion.options.length) {
      setCurrentHoveredOptionIndex(index)
    }
  }

  const navigateQuiz = (forward = true) => {
    setCurrentHoveredOptionIndex(-1)
    setCurrentQuestionIndex((prev) =>
      Math.min(Math.max(prev + (forward ? 1 : -1), 0), amountQuestions - 1)
    )
  }

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

  useEffect(() => {
    if (currentHoveredOptionIndex !== -1) {
      const index = currentHoveredOptionIndex
      if (index >= 0 && index < currentOptionsLength) {
        const currentRef = ref.current[index].current
        currentRef?.focus()
      }
    }
  }, [currentHoveredOptionIndex, currentOptionsLength])

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

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
        {currentQuestion.label && (
          <Badge className="ml-auto" variant="outline">
            {currentQuestion.label}
          </Badge>
        )}
      </div>
      <div className="mt-2">
        <div className="h-6 w-6 shrink-0 flex items-end float-right top-0">
          {guessMutateIsPending && (
            <Loader2 className="h-5 w-5 animate-spin mt-2 mr-2" />
          )}
          {lastGuessSyncSuccess !== null &&
            (lastGuessSyncSuccess ? (
              <CircleCheck className="h-5 w-5 mt-2 mr-2" />
            ) : (
              <CircleX className="text-red-500 h-5 w-5 mt-2 mr-2" />
            ))}
        </div>
        <h3 className="text-2xl font-semibold">
          <Latex>{getPartByLocale(currentQuestion.question, "nb_NO")}</Latex>
        </h3>
      </div>
      <div className="mt-4 flex flex-col gap-y-3">
        {currentQuestion.options.map((option, index) => (
          <button
            ref={ref.current[index]}
            type="button"
            key={option.id}
            onClick={() => handleOptionClick(index)}
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
              <Latex>{getPartByLocale(option.option, "nb_NO")}</Latex>
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
