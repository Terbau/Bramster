import { useToast } from "@/components/ui/use-toast"
import type { Question, QuestionCreate } from "@/types/question"
import {
  type UseMutationOptions,
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

type Writeable = QuestionCreate
type Response = Question

export interface UseUpdateQuestionParams {
  questionId: string
}

export const useUpdateQuestion = (
  { questionId }: UseUpdateQuestionParams,
  options?: Omit<
    UseMutationOptions<Response, Error, Writeable, unknown>,
    "mutationFn"
  >
): UseMutationResult<Response, Error, Writeable, unknown> => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation<Response, Error, Writeable, unknown>({
    mutationFn: (data) =>
      fetch(`/api/questions/${questionId}`, {
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
          description: "Question updated successfully",
        })
        queryClient.setQueryData(["question", data.id], data)
        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        toast({
          variant: "destructive",
          description: "Failed to update question",
        })
        options?.onError?.(error, variables, context)
      },
    },
  })
}
