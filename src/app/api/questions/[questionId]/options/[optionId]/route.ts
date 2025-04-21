import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { NextResponse, type NextRequest } from "next/server"
import {
  QuestionOptionCreateSchema,
  type QuestionOption,
} from "@/types/question"
import {
  deleteQuestionOption,
  getQuestionOption,
  updateQuestionOption,
} from "@/lib/functions/question"

export interface QuestionOptionParams {
  params: { optionId: string }
}

export async function GET(
  _: NextRequest,
  { params }: QuestionOptionParams
): Promise<NextResponse<QuestionOption | undefined>> {
  const questionOptionId = params.optionId

  const questionOption = await getQuestionOption(questionOptionId)
  return NextResponse.json(questionOption)
}

export async function PUT(
  request: NextRequest,
  { params }: QuestionOptionParams
) {
  const questionOptionId = params.optionId

  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  if (!session.user.admin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const questionOptionData = QuestionOptionCreateSchema.parse(body)

  const questionOption = await updateQuestionOption(
    questionOptionId,
    questionOptionData
  )
  return NextResponse.json(questionOption)
}

export async function DELETE(_: NextRequest, { params }: QuestionOptionParams) {
  const questionOptionId = params.optionId

  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  if (!session.user.admin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  const questionOption = await deleteQuestionOption(questionOptionId)
  return NextResponse.json(questionOption)
}
