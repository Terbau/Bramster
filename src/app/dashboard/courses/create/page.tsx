"use client"

import type { Course } from "@/types/course"
import { useRouter } from "next/navigation"
import { CourseForm } from "@/components/DashboardForms/CourseForm"
import { useCreateCourse } from "@/hooks/useCreateCourse"

export default function DashboardCoursesDetailPage() {
  const router = useRouter()

  const { mutate: mutateCreate, isPending: isPendingCreate } = useCreateCourse({
    onSuccess: (data: Course) => {
      router.push(`/dashboard/courses/${data.id}`)
    },
  })

  return (
    <CourseForm
      onSubmit={mutateCreate}
      submitButtonText="Create"
      submitIsLoading={isPendingCreate}
    />
  )
}
