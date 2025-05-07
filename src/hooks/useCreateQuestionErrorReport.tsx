import { useToast } from "@/components/ui/use-toast"
import type {
  StrippedQuestionErrorReportCreate,
  QuestionErrorReport,
} from "@/types/report"

import {
  type UseMutationOptions,
  type UseMutationResult,
  useMutation,
} from "@tanstack/react-query"

type Writeable = StrippedQuestionErrorReportCreate
type Response = QuestionErrorReport

export interface UseCreateQuestionErrorReportParams {
  questionId: string
}

export const useCreateQuestionErrorReport = (
  { questionId }: UseCreateQuestionErrorReportParams,
  options?: Omit<
    UseMutationOptions<Response, Error, Writeable, unknown>,
    "mutationFn"
  >
): UseMutationResult<Response, Error, Writeable, unknown> => {
  const { toast } = useToast()

  return useMutation<Response, Error, Writeable, unknown>({
    mutationFn: (data) =>
      fetch(`/api/questions/${questionId}/report`, {
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
          description: "Report submitted successfully",
        })
        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        toast({
          variant: "destructive",
          description: "Failed to submit report",
        })
        options?.onError?.(error, variables, context)
      },
    },
  })
}
