"use client"

import { Breadcrumb } from "@/components/Breadcrumb"
import { Spinner } from "@/components/Spinner"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { capitalized, compareOrigins } from "@/lib/utils"
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
        data.sort((a, b) => compareOrigins(a.origin, b.origin))

        // insert at the beginning the total of all questions
        data.splice(0, 0, {
          origin: "all",
          label: null,
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
        <div className="grid auto-cols-fr md:grid-cols-4 auto-rows-max md:auto-rows-fr gap-4 sm:gap-8">
          {courseOrigins?.map((courseOrigin) => (
            <Link
              key={courseOrigin.origin}
              href={`/courses/${courseId}/${courseOrigin.origin}`}
            >
              <Card className="cursor-pointer h-full hover:bg-gray-50 flex flex-col justify-between relative">
                {courseOrigin.label && (
                  <Badge className="absolute -top-3 -right-2">
                    {courseOrigin.label}
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle>{capitalized(courseOrigin.origin)}</CardTitle>
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
