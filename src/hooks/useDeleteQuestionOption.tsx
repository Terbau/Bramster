import { useToast } from "@/components/ui/use-toast"
import type { QuestionOption } from "@/types/question"
import {
  type UseMutationOptions,
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

type Writeable = { questionOptionId?: string }
type Response = QuestionOption

export interface UseDeleteQuestionOptionParams {
  questionId: string
  questionOptionId?: string
}

export const useDeleteQuestionOption = (
  { questionId, questionOptionId }: UseDeleteQuestionOptionParams,
  options?: Omit<
    UseMutationOptions<Response, Error, Writeable, unknown>,
    "mutationFn"
  >
): UseMutationResult<Response, Error, Writeable, unknown> => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation<Response, Error, Writeable, unknown>({
    mutationFn: (data) =>
      fetch(
        `/api/questions/${questionId}/options/${
          questionOptionId ?? data.questionOptionId
        }`,
        {
          method: "DELETE",
        }
      ).then((res) => res.json()),
    ...{
      ...options,
      onSuccess: (data, variables, context) => {
        toast({
          description: "Question option deleted successfully",
        })
        queryClient.setQueryData(["questionOption", questionOptionId], data)
        // queryClient.setQueryData(
        //   ["questionOptions", questionId],
        //   (oldData: QuestionOption[] | undefined) =>
        //     oldData?.filter((option) => option.id !== questionOptionId)
        // )
        queryClient.invalidateQueries({
          queryKey: ["questionOptions", questionId],
        })
        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        toast({
          variant: "destructive",
          description: "Failed to delete question option",
        })
        options?.onError?.(error, variables, context)
      },
    },
  })
}
