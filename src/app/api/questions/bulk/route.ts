import { authOptions } from "@/lib/auth"
import {
  createQuestionOptions,
  createQuestions,
} from "@/lib/functions/question"
import {
  type QuestionCreate,
  type QuestionOptionCreate,
  QuestionOptionCreateSchema,
  QuestionWithOptionsCreateSchema,
} from "@/types/question"
import { getServerSession } from "next-auth"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  if (!session.user.admin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()

  const questionsData = z.array(QuestionWithOptionsCreateSchema).parse(body)
  const questionsArray: QuestionCreate[] = []
  const optionsMap: Map<string, QuestionOptionCreate[]> = new Map()

  for (const questionData of questionsData) {
    const { options, ...question } = questionData

    questionsArray.push(question)

    if (options) {
      optionsMap.set(
        `${question.content}-${question.origin}`,
        options.map((option) => ({
          ...QuestionOptionCreateSchema.parse(option),
          questionId: "-1", // not yet found
        }))
      )
    }
  }

  const questions = await createQuestions(questionsArray)

  const optionsArray: QuestionOptionCreate[] = []

  for (const question of questions) {
    const options = optionsMap.get(
      `${question.content}-${question.origin}`
    ) as QuestionOptionCreate[]

    if (options) {
      for (const option of options) {
        option.questionId = question.id
        optionsArray.push(option)
      }
    }
  }

  const options = await createQuestionOptions(optionsArray)

  const questionsWithOptions = questions.map((question) => ({
    ...question,
    options: options.filter((option) => option.questionId === question.id),
  }))
  return NextResponse.json(questionsWithOptions, { status: 200 })
}
