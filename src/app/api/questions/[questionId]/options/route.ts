import { type NextRequest, NextResponse } from "next/server"
import {
  createQuestionOption,
  getQuestionOptions,
} from "@/lib/functions/question"
import type { QuestionParams } from "../route"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { QuestionOptionCreateSchema } from "@/types/question"

export async function GET(_: NextRequest, { params }: QuestionParams) {
  const questionId = params.questionId

  const questionOption = await getQuestionOptions(questionId)
  return NextResponse.json(questionOption)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  if (!session.user.admin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const questionOptionData = QuestionOptionCreateSchema.parse(body)

  const questionOption = await createQuestionOption(questionOptionData)
  return NextResponse.json(questionOption)
}
