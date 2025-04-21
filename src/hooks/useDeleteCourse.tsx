import { useToast } from "@/components/ui/use-toast"
import type { Course } from "@/types/course"
import {
  type UseMutationOptions,
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

type Response = Course

export interface UseDeleteCourseParams {
  courseId: string
}

export const useDeleteCourse = (
  { courseId }: UseDeleteCourseParams,
  options?: Omit<
    UseMutationOptions<Response, Error, void, unknown>,
    "mutationFn"
  >
): UseMutationResult<Response, Error, void, unknown> => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation<Response, Error, void, unknown>({
    mutationFn: () =>
      fetch(`/api/courses/${courseId}`, {
        method: "DELETE",
      }).then((res) => res.json()),
    ...{
      ...options,
      onSuccess: (data, variables, context) => {
        toast({
          description: "Course deleted successfully",
        })
        queryClient.invalidateQueries({
          queryKey: ["course", courseId],
        })
        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        toast({
          variant: "destructive",
          description: "Failed to delete course",
        })
        options?.onError?.(error, variables, context)
      },
    },
  })
}
