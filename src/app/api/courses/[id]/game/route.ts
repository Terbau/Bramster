import { authOptions } from "@/lib/auth"
import { createGameSession } from "@/lib/functions/game"
import { getQuestionsWithOptions } from "@/lib/functions/question"
import { getServerSession } from "next-auth"
import { NextResponse, type NextRequest } from "next/server"
import type { CourseParams } from "../route"

interface PostRequestData {
  origin: string
  amountQuestions?: number
  random?: boolean
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
  const randomOrder = body.random ?? false

  if (!origin) {
    return NextResponse.json({ message: "Origin is required" }, { status: 400 })
  }

  const [gameSession, questionsWithOptions] = await Promise.all([
    createGameSession({ userId: session.user.id, amountQuestions }),
    getQuestionsWithOptions(courseId, origin, amountQuestions, randomOrder),
  ])

  return NextResponse.json({
    gameSession,
    questions: questionsWithOptions,
  })
}
