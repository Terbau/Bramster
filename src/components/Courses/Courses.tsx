"use client"

import type { ExtendedCourse } from "@/types/course"
import { useQuery } from "@tanstack/react-query"
import { Spinner } from "../Spinner"
import Link from "next/link"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card"

export const Courses = () => {
  const { data: courses, isLoading } = useQuery<ExtendedCourse[]>({
    queryKey: ["courses"],
    queryFn: () => fetch("/api/courses").then((res) => res.json()),
  })

  if (isLoading) {
    return <Spinner />
  }

  return (
    <div className="flex flex-wrap gap-8">
      {courses?.map((course) => (
        <Link key={course.id} href={`/courses/${course.id}`}>
          <Card className="w-80 h-44 cursor-pointer hover:bg-gray-50 flex flex-col justify-between">
            <CardHeader>
              <CardTitle>{course.id.toUpperCase()}</CardTitle>
              <CardDescription>{course.name}</CardDescription>
            </CardHeader>
            <CardFooter>
              {course.totalQuestions} questions • {course.totalOrigins} sets
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  )
}
