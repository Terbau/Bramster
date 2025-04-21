import type { Course, CourseCreate, ExtendedCourse } from "@/types/course"
import { db } from "../db"
import { sql } from "kysely"
import type { OriginDetails } from "@/types/question"
import type { SortDirection } from "@/types/pagination"

export const getCoursesAmount = async (like?: string): Promise<number> => {
  const amountOfCourses = await db
    .selectFrom("course")
    .select(({ fn }) => [fn.count<number>("id").as("amount")])
    .$if(like !== undefined, (qb) => qb.where("name", "ilike", `%${like}%`))
    .executeTakeFirst()
  return amountOfCourses?.amount ?? 0
}

export const getCourses = async (
  page = 0,
  pageSize = -1,
  sortBy: keyof Course = "createdAt",
  sortDirection: SortDirection = "asc",
  like?: string
): Promise<ExtendedCourse[]> => {
  const courses = await db
    .selectFrom("course")
    .selectAll("course")
    .leftJoin("question", "course.id", "question.courseId")
    .select(({ fn, ref }) => [
      fn.count<number>("question.id").as("totalQuestions"),
      sql<number>`count(DISTINCT ${ref("question.origin")})`.as("totalOrigins"),
    ])
    .$if(pageSize > -1, (qb) => qb.limit(pageSize))
    .orderBy(sortBy, sortDirection)
    .offset(page * pageSize)
    .$if(like !== undefined, (qb) =>
      qb.where((eb) => eb("name", "ilike", `%${like}%`))
    )
    .groupBy(["course.id", "course.name"])
    .execute()

  return courses
}

export const getCourse = async (
  courseId: string
): Promise<Course | undefined> => {
  const course = await db
    .selectFrom("course")
    .selectAll()
    .where("id", "=", courseId)
    .executeTakeFirst()

  return course
}

export const createCourse = async (course: CourseCreate): Promise<Course> => {
  const createdCourse = await db
    .insertInto("course")
    .values(course)
    .returningAll()
    .executeTakeFirstOrThrow()

  return createdCourse
}

export const updateCourse = async (
  courseId: Course["id"],
  course: CourseCreate
): Promise<Course> => {
  const updatedCourse = await db
    .updateTable("course")
    .set({
      ...course,
      updatedAt: new Date(),
    })
    .where("id", "=", courseId)
    .returningAll()
    .executeTakeFirstOrThrow()

  return updatedCourse
}

export const deleteCourse = async (courseId: Course["id"]): Promise<Course> => {
  const deletedCourse = await db
    .deleteFrom("course")
    .where("id", "=", courseId)
    .returningAll()
    .executeTakeFirstOrThrow()

  return deletedCourse
}

export const getOrigins = async (
  courseId?: string
): Promise<OriginDetails[]> => {
  const origins = await db
    .selectFrom("question")
    .select(({ fn }) => [
      "question.origin",
      "question.label",
      fn.count<number>("question.id").as("totalQuestions"),
    ])
    .$if(courseId !== undefined, (qb) =>
      qb
        .leftJoin("course", "question.courseId", "course.id")
        .where("course.id", "=", courseId ?? "")
    )
    .groupBy(["question.origin", "question.label"])
    .execute()

  return origins
}
