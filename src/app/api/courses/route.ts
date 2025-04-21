import { authOptions } from "@/lib/auth"
import {
  createCourse,
  getCourses,
  getCoursesAmount,
} from "@/lib/functions/course"
import { parseKey } from "@/lib/utils"
import {
  CourseCreateSchema,
  CourseSchema,
  type ExtendedCourse,
} from "@/types/course"
import { type Paginated, SortDirectionSchema } from "@/types/pagination"
import { getServerSession } from "next-auth"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest
): Promise<NextResponse<Paginated<ExtendedCourse>>> {
  const { searchParams } = new URL(request.url)
  const page = Number(searchParams.get("page") ?? "0")
  const pageSize = Number(searchParams.get("pageSize") ?? "30")
  const sortBy = parseKey(
    CourseSchema,
    searchParams.get("sortBy") ?? "createdAt"
  )
  const sortDirection = SortDirectionSchema.parse(
    searchParams.get("sortDirection") ?? "asc"
  )

  const query = searchParams.get("query") || undefined

  const [courses, totalCourses] = await Promise.all([
    getCourses(page, pageSize, sortBy, sortDirection, query),
    getCoursesAmount(query),
  ])

  return NextResponse.json(
    {
      total: totalCourses,
      results: courses,
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
  const data = CourseCreateSchema.parse(body)

  const course = await createCourse(data)
  return NextResponse.json(course)
}
