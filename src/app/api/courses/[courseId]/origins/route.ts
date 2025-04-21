import { getOrigins } from "@/lib/functions/course"
import { NextResponse, type NextRequest } from "next/server"
import type { CourseParams } from "../route"

export async function GET(_: NextRequest, { params }: CourseParams) {
  const courseId = params.courseId

  const courseOrigin = await getOrigins(courseId)
  return NextResponse.json(courseOrigin)
}
