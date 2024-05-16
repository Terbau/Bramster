import { getCourseOrigins } from "@/lib/functions/course"
import { NextResponse, type NextRequest } from "next/server"

export interface CourseParams {
  params: { id: string }
}

export async function GET(_: NextRequest, { params }: CourseParams) {
  const courseId = params.id

  const courseOrigin = await getCourseOrigins(courseId)
  return NextResponse.json(courseOrigin)
}
