import type { Question } from "@/types/question"
import {
  useQuery,
  type UseQueryResult,
  type UseQueryOptions,
} from "@tanstack/react-query"

type Response = Question | undefined

export interface UseGetQuestionParams {
  questionId: string
}

export const useGetQuestion = (
  { questionId }: UseGetQuestionParams,
  options?: Omit<UseQueryOptions<Response>, "queryKey" | "queryFn">
): UseQueryResult<Response> => {
  return useQuery<Response>({
    queryKey: ["question", questionId],
    queryFn: () =>
      fetch(`/api/questions/${questionId}`).then((res) => res.json()),
    ...options,
  })
}
