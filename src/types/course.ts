import { z } from "zod"

export const Course = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
  id: z.string(),
  name: z.string(),
})

export type Course = z.infer<typeof Course>

export const CourseCreate = Course.omit({ createdAt: true, updatedAt: true })

export type CourseCreate = z.infer<typeof CourseCreate>

export const ExtendedCourse = Course.extend({
  totalOrigins: z.number(),
  totalQuestions: z.number(),
})

export type ExtendedCourse = z.infer<typeof ExtendedCourse>

export const CourseOrigin = z.object({
  origin: z.string(),
  totalQuestions: z.number(),
  label: z.string().nullable(),
})

export type CourseOrigin = z.infer<typeof CourseOrigin>
