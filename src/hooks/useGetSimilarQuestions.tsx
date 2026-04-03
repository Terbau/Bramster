import type { SimilarQuestion } from "@/lib/functions/question"
import { useQuery, type UseQueryResult } from "@tanstack/react-query"

export const useGetSimilarQuestions = (
  questionId: string
): UseQueryResult<SimilarQuestion[]> => {
  return useQuery<SimilarQuestion[]>({
    queryKey: ["similarQuestions", questionId],
    queryFn: () =>
      fetch(`/api/questions/${questionId}/similar`).then((res) => res.json()),
  })
}
