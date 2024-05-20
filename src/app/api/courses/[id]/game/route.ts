import { authOptions } from "@/lib/auth"
import { createGameSession } from "@/lib/functions/game"
import {
  getAmountOfQuestionsForOrigin,
  getQuestionsWithOptions,
  getQuestionsWithOptionsBasedOnHistory,
} from "@/lib/functions/question"
import { getServerSession } from "next-auth"
import { NextResponse, type NextRequest } from "next/server"
import type { CourseParams } from "../route"
import type { GameSession } from "@/types/game"
import type { QuestionWithOptions } from "@/types/question"

interface PostRequestData {
  origin: string
  amountQuestions?: number
  order?: string
}

export async function POST(request: NextRequest, { params }: CourseParams) {
  const courseId = params.id

  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const body: PostRequestData = await request.json()
  const origin = body.origin
  const amountQuestions = body.amountQuestions ?? -1
  const order = body.order?.toLowerCase() ?? "random"

  if (!origin) {
    return NextResponse.json({ message: "Origin is required" }, { status: 400 })
  }

  const actualAmountOfQuestions = await getAmountOfQuestionsForOrigin(
    courseId,
    origin
  )
  const amountQuestionsToGet = Math.min(
    amountQuestions,
    actualAmountOfQuestions
  )

  const funcs: [Promise<GameSession>, Promise<QuestionWithOptions[]>] = [
    createGameSession({
      origin,
      userId: session.user.id,
      amountQuestions: amountQuestionsToGet,
      courseId,
    }),
    order === "worst"
      ? getQuestionsWithOptionsBasedOnHistory(
          courseId,
          origin,
          session.user.id,
          amountQuestionsToGet
        )
      : getQuestionsWithOptions(
          courseId,
          origin,
          amountQuestionsToGet,
          order === "random"
        ),
  ]

  const [gameSession, questionsWithOptions] = await Promise.all(funcs)

  return NextResponse.json({
    gameSession,
    questions: questionsWithOptions,
  })
}
