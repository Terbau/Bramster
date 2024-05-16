import type { CourseOrigin, ExtendedCourse } from "@/types/course"
import { db } from "../db"
import { sql } from "kysely"

export const getCourses = async (): Promise<ExtendedCourse[]> => {
  const courses = await db
    .selectFrom("course")
    .leftJoin("question", "course.id", "question.courseId")
    .select(({ fn, ref }) => [
      "course.id",
      "course.name",
      "course.createdAt",
      "course.updatedAt",
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
      fn.count<number>("question.id").as("totalQuestions"),
    ])
    .where("course.id", "=", courseId)
    .groupBy("origin")
    .execute()

  return origins
}
