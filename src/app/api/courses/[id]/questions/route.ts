import { authOptions } from "@/lib/auth"
import {
  getQuestionsWithOptions,
  getQuestionsWithOptionsBasedOnHistory,
} from "@/lib/functions/question"
import { getServerSession } from "next-auth"
import { NextResponse, type NextRequest } from "next/server"
import type { CourseParams } from "../route"

export async function GET(request: NextRequest, { params }: CourseParams) {
  const courseId = params.id

  const session = await getServerSession(authOptions)
  if (!session) {
    // return NextResponse.redirect("/api/auth/signin")
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const origin = searchParams.get("origin")
  const limit = Number(searchParams.get("limit") ?? "-1")
  const order = searchParams.get("order")?.toLowerCase() ?? "worst"

  if (!origin) {
    return NextResponse.json({ message: "Origin is required" }, { status: 400 })
  }

  if (order === "worst") {
    const questionWithOptions = await getQuestionsWithOptionsBasedOnHistory(
      courseId,
      origin,
      session.user.id,
      limit
    )
    return NextResponse.json(questionWithOptions)
  }

  const questionsWithOptions = await getQuestionsWithOptions(
    courseId,
    origin,
    limit,
    order === "random"
  )
  return NextResponse.json(questionsWithOptions)
}
