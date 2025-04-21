import { authOptions } from "@/lib/auth"
import {
  deleteQuestion,
  getQuestion,
  updateQuestion,
} from "@/lib/functions/question"
import { QuestionCreateSchema, type Question } from "@/types/question"
import { getServerSession } from "next-auth"
import { NextResponse, type NextRequest } from "next/server"

export interface QuestionParams {
  params: { questionId: string }
}

export async function GET(
  _: NextRequest,
  { params }: QuestionParams
): Promise<NextResponse<Question | undefined>> {
  const questionId = params.questionId

  const question = await getQuestion(questionId)
  return NextResponse.json(question)
}

export async function PUT(request: NextRequest, { params }: QuestionParams) {
  const questionId = params.questionId

  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  if (!session.user.admin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const questionData = QuestionCreateSchema.parse(body)

  const question = await updateQuestion(questionId, questionData)
  return NextResponse.json(question)
}

export async function DELETE(_: NextRequest, { params }: QuestionParams) {
  const questionId = params.questionId

  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  if (!session.user.admin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  const question = await deleteQuestion(questionId)
  return NextResponse.json(question)
}
