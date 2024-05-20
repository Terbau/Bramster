import type { CourseOrigin, ExtendedCourse } from "@/types/course"
import { db } from "../db"
import { sql } from "kysely"

export const getCourses = async (): Promise<ExtendedCourse[]> => {
  const courses = await db
    .selectFrom("course")
    .selectAll("course")
    .leftJoin("question", "course.id", "question.courseId")
    .select(({ fn, ref }) => [
      fn.count<number>("question.id").as("totalQuestions"),
      sql<number>`count(DISTINCT ${ref("question.origin")})`.as("totalOrigins"),
    ])
    .groupBy(["course.id", "course.name"])
    .execute()

  return courses
}

export const getCourseOrigins = async (
  courseId: string
): Promise<CourseOrigin[]> => {
  const origins = await db
    .selectFrom("question")
    .leftJoin("course", "question.courseId", "course.id")
    .select(({ fn }) => [
      "question.origin",
      "question.label",
      fn.count<number>("question.id").as("totalQuestions"),
    ])
    .where("course.id", "=", courseId)
    .groupBy(["question.origin", "question.label"])
    .execute()

  return origins
}
