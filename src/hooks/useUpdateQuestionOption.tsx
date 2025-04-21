import { useToast } from "@/components/ui/use-toast"
import type { QuestionOption, QuestionOptionCreate } from "@/types/question"
import {
  type UseMutationOptions,
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

type Writeable = {
  questionOptionId?: string
  data: QuestionOptionCreate
}
type Response = QuestionOption

export interface UseUpdateQuestionOptionParams {
  questionId: string
  questionOptionId?: string
}

export const useUpdateQuestionOption = (
  { questionId, questionOptionId }: UseUpdateQuestionOptionParams,
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
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data.data),
        }
      ).then((res) => res.json()),
    ...{
      ...options,
      onSuccess: (data, variables, context) => {
        toast({
          description: "Question option updated successfully",
        })
        queryClient.setQueryData(
          ["questionOptions", questionId],
          (oldData: QuestionOption[]) => {
            return oldData?.map((option: QuestionOption) =>
              option.id === questionOptionId ? { ...option, ...data } : option
            )
          }
        )
        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        toast({
          variant: "destructive",
          description: "Failed to update question option",
        })
        options?.onError?.(error, variables, context)
      },
    },
  })
}
