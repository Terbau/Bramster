import { getSimilarQuestions } from "@/lib/functions/question"
import { NextResponse, type NextRequest } from "next/server"

export interface QuestionParams {
  params: { questionId: string }
}

export async function GET(_: NextRequest, { params }: QuestionParams) {
  const similar = await getSimilarQuestions(params.questionId)
  return NextResponse.json(similar)
}
