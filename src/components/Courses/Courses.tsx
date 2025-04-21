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
import type { Paginated } from "@/types/pagination"

export const Courses = () => {
  const { data: courses, isLoading } = useQuery<Paginated<ExtendedCourse>>({
    queryKey: ["courses", 0, -1, "createdAt", "asc", ""],
    queryFn: () => fetch("/api/courses?pageSize=-1").then((res) => res.json()),
  })

  if (isLoading) {
    return <Spinner />
  }

  return (
    <div className="grid auto-cols-fr lg:grid-cols-3 gap-4 sm:gap-8">
      {courses?.results.map((course) => (
        <Link key={course.id} href={`/courses/${course.id}`}>
          <Card className="h-44 cursor-pointer hover:bg-gray-50 flex flex-col justify-between">
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
