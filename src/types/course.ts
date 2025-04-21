import { z } from "zod"

export const CourseSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
  id: z.string(),
  name: z.string(),
})

export type Course = z.infer<typeof CourseSchema>

export const CourseCreateSchema = CourseSchema.omit({ createdAt: true, updatedAt: true })

export type CourseCreate = z.infer<typeof CourseCreateSchema>

export const ExtendedCourseSchema = CourseSchema.extend({
  totalOrigins: z.number(),
  totalQuestions: z.number(),
})

export type ExtendedCourse = z.infer<typeof ExtendedCourseSchema>

