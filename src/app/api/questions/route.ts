import { authOptions } from "@/lib/auth"
import {
  createQuestion,
  deleteQuestions,
  getQuestions,
  getQuestionsAmount,
} from "@/lib/functions/question"
import { parseKey } from "@/lib/utils"
import { SortDirectionSchema, type Paginated } from "@/types/pagination"
import {
  QuestionCreateSchema,
  QuestionSchema,
  QuestionTypeSchema,
  type Question,
} from "@/types/question"
import { getServerSession } from "next-auth"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

export async function GET(
  request: NextRequest
): Promise<NextResponse<Paginated<Question>>> {
  const { searchParams } = new URL(request.url)
  const page = Number(searchParams.get("page") ?? "0")
  const pageSize = Number(searchParams.get("pageSize") ?? "30")
  const courseIds = searchParams.getAll("courseId")
  const origins = searchParams.getAll("origin")
  const types = searchParams
    .getAll("type")
    .map((type) => QuestionTypeSchema.parse(type))
  const sortBy = parseKey(
    QuestionSchema,
    searchParams.get("sortBy") ?? "createdAt"
  )
  const sortDirection = SortDirectionSchema.parse(
    searchParams.get("sortDirection") ?? "asc"
  )

  const query = searchParams.get("query") || undefined

  const [questions, totalQuestions] = await Promise.all([
    getQuestions(
      courseIds,
      origins,
      types,
      page,
      pageSize,
      sortBy,
      sortDirection,
      query
    ),
    getQuestionsAmount(courseIds, origins, types, query),
  ])

  return NextResponse.json(
    {
      total: totalQuestions,
      results: questions,
    },
    { status: 200 }
  )
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
  const questionData = QuestionCreateSchema.parse(body)

  const question = await createQuestion(questionData)
  return NextResponse.json(question)
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  if (!session.user.admin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const { data: questionIds } = z.object({ data: z.array(z.string())}).parse(body)

  const deletedQuestions = await deleteQuestions(questionIds)
  return NextResponse.json(deletedQuestions)
}
