"use client"

import type { Question } from "@/types/question"
import { useRouter, useSearchParams } from "next/navigation"
import {
  QuestionForm,
  type QuestionFormData,
} from "@/components/DashboardForms/QuestionForm"
import { useCreateQuestion } from "@/hooks/useCreateQuestion"
import { useGetCourses } from "@/hooks/useGetCourses"
import { useGetOrigins } from "@/hooks/useGetOrigins"

export default function DashboardQuestionsDetailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const type = searchParams.get("type")
  const courseId = searchParams.get("courseId")
  const origin = searchParams.get("origin")
  const label = searchParams.get("label")

  const defaultValues: Partial<QuestionFormData> = {}

  if (type) {
    defaultValues.type = type as Question["type"]
  }
  if (courseId) {
    defaultValues.courseId = courseId
  }
  if (origin) {
    defaultValues.origin = origin
  }
  if (label) {
    defaultValues.label = label
  }

  const { mutate: mutateCreate, isPending: isPendingCreate } =
    useCreateQuestion({
      onSuccess: (data: Question) => {
        router.push(`/dashboard/questions/${data.id}`)
      },
    })

  const { data: coursesData, isLoading: coursesIsLoading } = useGetCourses({})

  const { data: originsData, isLoading: originsIsLoading } = useGetOrigins()

  return (
    <QuestionForm
      defaultValues={defaultValues}
      coursesData={coursesData}
      originsData={originsData}
      onSubmit={mutateCreate}
      submitButtonText="Create"
      submitIsLoading={isPendingCreate}
    />
  )
}
