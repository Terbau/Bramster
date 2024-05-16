import { getCourses } from "@/lib/functions/course"
import { NextResponse } from "next/server"

export async function GET() {
  const courses = await getCourses()

  return NextResponse.json(courses, { status: 200 })
}
