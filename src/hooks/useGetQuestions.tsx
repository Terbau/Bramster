import type { Paginated } from "@/types/pagination"
import type { Question } from "@/types/question"
import {
  useQuery,
  type UseQueryResult,
  type UseQueryOptions,
} from "@tanstack/react-query"

type Response = Paginated<Question>

export interface UseGetQuestionsParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortDirection?: "asc" | "desc"
  query?: string
  origins?: Question["origin"][]
  types?: Question["type"][]
  courseIds?: Question["courseId"][]
}

export const useGetQuestions = (
  {
    page = 0,
    pageSize = -1,
    sortBy = "createdAt",
    sortDirection = "asc",
    query = "",
    origins = [],
    types = [],
    courseIds = [],
  }: UseGetQuestionsParams,
  options?: Omit<UseQueryOptions<Response>, "queryKey" | "queryFn">
): UseQueryResult<Response> => {
  const params = new URLSearchParams([
    ["page", page.toString()],
    ["pageSize", pageSize.toString()],
    ["sortBy", sortBy],
    ["sortDirection", sortDirection],
    ["query", query],
    ...origins.map((origin) => ["origin", origin]),
    ...types.map((type) => ["type", type]),
    ...courseIds.map((course) => ["courseId", course]),
  ])

  return useQuery<Response>({
    queryKey: [
      "questions",
      page,
      pageSize,
      sortBy,
      sortDirection,
      query,
      origins,
      types,
      courseIds,
    ],
    queryFn: () => fetch(`/api/questions?${params}`).then((res) => res.json()),
    ...options,
  })
}
