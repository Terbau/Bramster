import { authOptions } from "@/lib/auth"
import { getQuestionsWithOptions } from "@/lib/functions/question"
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
  const limit = searchParams.get("limit") ?? "-1"
  const random = searchParams.get("random") ?? "false"

  if (!origin) {
    return NextResponse.json({ message: "Origin is required" }, { status: 400 })
  }

  const questionsWithOptions = await getQuestionsWithOptions(
    courseId,
    origin,
    Number(limit),
    random === "true"
  )
  return NextResponse.json(questionsWithOptions)
}
