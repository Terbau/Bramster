import { authOptions } from "@/lib/auth"
import { createQuestionErrorReport } from "@/lib/functions/report"
import { StrippedQuestionErrorReportCreateSchema } from "@/types/report"
import { getServerSession } from "next-auth"
import { NextResponse, type NextRequest } from "next/server"

export interface QuestionParams {
  params: { questionId: string }
}

export async function POST(request: NextRequest, { params }: QuestionParams) {
  const questionId = params.questionId

  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const questionData = StrippedQuestionErrorReportCreateSchema.parse(body)

  if (questionData.status !== "OPEN") {
    return NextResponse.json(
      { message: "Invalid status" },
      { status: 400 }
    )
  }

  const report = await createQuestionErrorReport({
    createdBy: session.user.id,
    questionId,
    ...questionData,
  })
  return NextResponse.json(report)
}
