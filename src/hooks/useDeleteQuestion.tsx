import { useToast } from "@/components/ui/use-toast"
import type { Question } from "@/types/question"
import {
  type UseMutationOptions,
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

type Response = Question

export interface UseDeleteQuestionParams {
  questionId: string
}

export const useDeleteQuestion = (
  { questionId }: UseDeleteQuestionParams,
  options?: Omit<
    UseMutationOptions<Response, Error, void, unknown>,
    "mutationFn"
  >
): UseMutationResult<Response, Error, void, unknown> => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation<Response, Error, void, unknown>({
    mutationFn: () =>
      fetch(`/api/questions/${questionId}`, {
        method: "DELETE",
      }).then((res) => res.json()),
    ...{
      ...options,
      onSuccess: (data, variables, context) => {
        toast({
          description: "Question deleted successfully",
        })
        queryClient.invalidateQueries({
          queryKey: ["question", questionId],
        })
        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        toast({
          variant: "destructive",
          description: "Failed to delete question",
        })
        options?.onError?.(error, variables, context)
      },
    },
  })
}
