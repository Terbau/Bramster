import type { ExtendedCourse } from "@/types/course"
import type { Paginated } from "@/types/pagination"
import {
  useQuery,
  type UseQueryResult,
  type UseQueryOptions,
} from "@tanstack/react-query"

type Response = Paginated<ExtendedCourse>

export interface UseGetCoursesParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortDirection?: "asc" | "desc"
  query?: string
}

export const useGetCourses = (
  {
    page = 0,
    pageSize = -1,
    sortBy = "name",
    sortDirection = "asc",
    query = "",
  }: UseGetCoursesParams,
  options?: Omit<UseQueryOptions<Response>, "queryKey" | "queryFn">
): UseQueryResult<Response> => {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    sortBy,
    sortDirection,
    query,
  })

  return useQuery<Response>({
    queryKey: ["courses", page, pageSize, sortBy, sortDirection, query],
    queryFn: () => fetch(`/api/courses?${params}`).then((res) => res.json()),
    ...options,
  })
}
