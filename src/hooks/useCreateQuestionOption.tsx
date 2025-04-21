import { useToast } from "@/components/ui/use-toast"
import type { QuestionOption, QuestionOptionCreate } from "@/types/question"
import {
  type UseMutationOptions,
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

type Writeable = QuestionOptionCreate
type Response = QuestionOption

export interface UseCreateQuestionOptionParams {
  questionId: string
}

export const useCreateQuestionOption = (
  { questionId }: UseCreateQuestionOptionParams,
  options?: Omit<
    UseMutationOptions<Response, Error, Writeable, unknown>,
    "mutationFn"
  >
): UseMutationResult<Response, Error, Writeable, unknown> => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation<Response, Error, Writeable, unknown>({
    mutationFn: (data) =>
      fetch(`/api/questions/${data.questionId}/options`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }).then((res) => res.json()),
    ...{
      ...options,
      onSuccess: (data, variables, context) => {
        toast({
          description: "Question option created successfully",
        })
        queryClient.setQueryData(["questionOption", data.id], data)
        queryClient.invalidateQueries({
          queryKey: ["questionOptions", questionId],
        })
        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        toast({
          variant: "destructive",
          description: "Failed to create question option",
        })
        options?.onError?.(error, variables, context)
      },
    },
  })
}
