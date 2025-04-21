"use client"

import { Spinner } from "@/components/Spinner"
import { useRouter } from "next/navigation"
import { CourseForm } from "@/components/DashboardForms/CourseForm"
import { useGetCourse } from "@/hooks/useGetCourse"
import { useUpdateCourse } from "@/hooks/useUpdateCourse"
import { useDeleteCourse } from "@/hooks/useDeleteCourse"

export interface DashboardCoursesDetailPageParams {
  params: { courseId: string }
}

export default function DashboardCoursesDetailPage({
  params,
}: DashboardCoursesDetailPageParams) {
  const router = useRouter()

  const { data: courseData, isLoading: courseIsLoading } = useGetCourse({
    courseId: params.courseId,
  })

  const { mutate: mutateUpdate, isPending: isPendingUpdate } = useUpdateCourse({
    courseId: params.courseId,
  })

  const { mutate: mutateDelete, isPending: isPendingDelete } = useDeleteCourse(
    { courseId: params.courseId },
    {
      onSuccess: () => {
        router.push("/dashboard/courses")
      },
    }
  )

  if (courseIsLoading) {
    return <Spinner />
  }

  if (!courseData) {
    return <div>Course not found</div>
  }

  return (
    <CourseForm
      defaultValues={courseData}
      onSubmit={mutateUpdate}
      onDelete={mutateDelete}
      submitIsLoading={isPendingUpdate}
      deleteIsLoading={isPendingDelete}
      submitButtonText="Update"
    />
  )
}
