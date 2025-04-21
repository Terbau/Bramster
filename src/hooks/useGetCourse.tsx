import type { Course } from "@/types/course"
import {
  useQuery,
  type UseQueryResult,
  type UseQueryOptions,
} from "@tanstack/react-query"

type Response = Course | undefined

export interface UseGetCourseParams {
  courseId: string
}

export const useGetCourse = (
  { courseId }: UseGetCourseParams,
  options?: Omit<UseQueryOptions<Response>, "queryKey" | "queryFn">
): UseQueryResult<Response> => {
  return useQuery<Response>({
    queryKey: ["course", courseId],
    queryFn: () => fetch(`/api/courses/${courseId}`).then((res) => res.json()),
    ...options,
  })
}
