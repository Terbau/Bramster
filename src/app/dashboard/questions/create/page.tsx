"use client"

import type { Question } from "@/types/question"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { QuestionForm } from "@/components/DashboardForms/QuestionForm"
import { useCreateQuestion } from "@/hooks/useCreateQuestion"
import { useGetCourses } from "@/hooks/useGetCourses"
import { useGetOrigins } from "@/hooks/useGetOrigins"

export default function DashboardQuestionsDetailPage() {
  const { toast } = useToast()
  const router = useRouter()

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
      coursesData={coursesData}
      originsData={originsData}
      onSubmit={mutateCreate}
      submitButtonText="Create"
      submitIsLoading={isPendingCreate}
    />
  )
}
