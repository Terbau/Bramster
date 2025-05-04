import { useToast } from "@/components/ui/use-toast"
import type {
  QuestionWithOptions,
  QuestionWithOptionsCreate,
} from "@/types/question"
import {
  type UseMutationOptions,
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

type Writeable = QuestionWithOptionsCreate[]
type Response = QuestionWithOptions[]

export const useCreateBulkQuestions = (
  options?: Omit<
    UseMutationOptions<Response, Error, Writeable, unknown>,
    "mutationFn"
  >
): UseMutationResult<Response, Error, Writeable, unknown> => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation<Response, Error, Writeable, unknown>({
    mutationFn: (data) =>
      fetch("/api/questions/bulk", {
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
          description: "Questions created successfully",
        })
        for (const question of data) {
          const { options, ...questionData } = question
          queryClient.setQueryData(["question", question.id], questionData)
          queryClient.setQueryData(["questionOptions", question.id], options)
        }

        queryClient.invalidateQueries({
          queryKey: ["questions"],
        })
        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        toast({
          variant: "destructive",
          description: "Failed to create questions",
        })
        options?.onError?.(error, variables, context)
      },
    },
  })
}
