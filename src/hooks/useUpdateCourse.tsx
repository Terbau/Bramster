import { useToast } from "@/components/ui/use-toast"
import type { Course, CourseCreate } from "@/types/course"
import {
  type UseMutationOptions,
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

type Writeable = CourseCreate
type Response = Course

export interface UseUpdateCourseParams {
  courseId: string
}

export const useUpdateCourse = (
  { courseId }: UseUpdateCourseParams,
  options?: Omit<
    UseMutationOptions<Response, Error, Writeable, unknown>,
    "mutationFn"
  >
): UseMutationResult<Response, Error, Writeable, unknown> => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation<Response, Error, Writeable, unknown>({
    mutationFn: (data) =>
      fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }).then((res) => res.json()),
    ...{
      ...options,
      onSuccess: (data, variables, context) => {
        toast({
          description: "Course updated successfully",
        })
        queryClient.setQueryData(["course", data.id], data)
        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        toast({
          variant: "destructive",
          description: "Failed to update course",
        })
        options?.onError?.(error, variables, context)
      },
    },
  })
}
