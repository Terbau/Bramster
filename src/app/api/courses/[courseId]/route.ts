import { authOptions } from "@/lib/auth"
import { deleteCourse, getCourse, updateCourse } from "@/lib/functions/course"
import { CourseCreateSchema, type Course } from "@/types/course"
import { getServerSession } from "next-auth"
import { NextResponse, type NextRequest } from "next/server"

export interface CourseParams {
  params: { courseId: string }
}

export async function GET(
  _: NextRequest,
  { params }: CourseParams
): Promise<NextResponse<Course | undefined>> {
  const courseId = params.courseId

  const course = await getCourse(courseId)
  return NextResponse.json(course)
}

export async function PUT(request: NextRequest, { params }: CourseParams) {
  const courseId = params.courseId

  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  if (!session.user.admin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const data = CourseCreateSchema.parse(body)

  const course = await updateCourse(courseId, data)
  return NextResponse.json(course)
}

export async function DELETE(_: NextRequest, { params }: CourseParams) {
  const courseId = params.courseId

  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  if (!session.user.admin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  const question = await deleteCourse(courseId)
  return NextResponse.json(question)
}
