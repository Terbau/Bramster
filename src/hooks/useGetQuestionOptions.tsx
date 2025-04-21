import type { QuestionOption } from "@/types/question"
import {
  useQuery,
  type UseQueryResult,
  type UseQueryOptions,
} from "@tanstack/react-query"

type Response = QuestionOption[]

export interface UseGetQuestionOptionsParams {
  questionId: string
}

export const useGetQuestionOptions = (
  { questionId }: UseGetQuestionOptionsParams,
  options?: Omit<UseQueryOptions<Response>, "queryKey" | "queryFn">
): UseQueryResult<Response> => {
  return useQuery<Response>({
    queryKey: ["questionOptions", questionId],
    queryFn: () =>
      fetch(`/api/questions/${questionId}/options`).then((res) => res.json()),
    ...options,
  })
}
