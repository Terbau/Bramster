import { useToast } from "@/components/ui/use-toast"
import type { Question } from "@/types/question"
import {
  type UseMutationOptions,
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

type Writeable = Question["id"][]
type Response = Question[]

export const useDeleteQuestions = (
  options?: Omit<
    UseMutationOptions<Response, Error, Writeable, unknown>,
    "mutationFn"
  >
): UseMutationResult<Response, Error, Writeable, unknown> => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation<Response, Error, Writeable, unknown>({
    mutationFn: (data) =>
      fetch("/api/questions", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data,
        }),
      }).then((res) => res.json()),
    ...{
      ...options,
      onSuccess: (data, variables, context) => {
        toast({
          description: "Questions deleted successfully",
        })
        queryClient.invalidateQueries({
          queryKey: ["questions"],
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
