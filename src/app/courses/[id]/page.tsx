"use client"

import { Breadcrumb } from "@/components/Breadcrumb"
import { Spinner } from "@/components/Spinner"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { CourseOrigin } from "@/types/course"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"

export default function CoursePage({ params }: { params: { id: string } }) {
  const courseId = params.id

  const { data: courseOrigins, isLoading } = useQuery<CourseOrigin[]>({
    queryKey: ["courseOrigins", courseId],
    queryFn: () =>
      fetch(`/api/courses/${courseId}`).then(async (res) => {
        const data: CourseOrigin[] = await res.json()
        data.sort((a: CourseOrigin, b: CourseOrigin) => {
          try {
            const [yearA, semesterA] = a.origin.split(" ")
            const [yearB, semesterB] = b.origin.split(" ")

            if (yearA === yearB) {
              return semesterB.localeCompare(semesterA)
            }
          } catch (e) {}

          return a.origin.localeCompare(b.origin)
        })

        data.push({
          origin: "All",
          totalQuestions: data.reduce(
            (acc, courseOrigin) => acc + courseOrigin.totalQuestions,
            0
          ),
        })

        return data
      }),
  })

  return (
    <div className="space-y-4">
      <Breadcrumb
        links={[
          { label: "Courses", href: "/courses" },
          { label: courseId.toUpperCase(), href: `/courses/${courseId}` },
        ]}
      />

      <h1 className="text-4xl font-bold">{courseId.toUpperCase()}</h1>
      {isLoading ? (
        <Spinner />
      ) : (
        <div className="grid grid-cols-4 auto-rows-fr gap-8">
          {courseOrigins?.map((courseOrigin) => (
            <Link
              key={courseOrigin.origin}
              href={`/courses/${courseId}/${courseOrigin.origin}`}
            >
              <Card className="cursor-pointer h-full hover:bg-gray-50 flex flex-col justify-between">
                <CardHeader>
                  <CardTitle>{courseOrigin.origin}</CardTitle>
                  <CardDescription>
                    {courseOrigin.totalQuestions} questions
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
