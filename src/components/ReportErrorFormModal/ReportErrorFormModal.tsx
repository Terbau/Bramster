import { useCreateQuestionErrorReport } from "@/hooks/useCreateQuestionErrorReport"
import { Button, LoadingButton } from "../ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../ui/dialog"
import { type ComponentProps, useCallback } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { isFieldRequired } from "@/lib/utils"
import { InputFormReady } from "../ui/input"
import { TextareaFormReady } from "../ui/textarea"

const ReportErrorSchema = z.object({
  questionId: z.string(),
  content: z.string().min(1, "Please provide a description of the error."),
})

export type ReportErrorFormData = z.infer<typeof ReportErrorSchema>

export interface ReportErrorFormModalProps
  extends ComponentProps<typeof Dialog> {
  questionId: string
}

export const ReportErrorFormModal = ({
  questionId,
  onOpenChange,
  ...props
}: ReportErrorFormModalProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReportErrorFormData>({
    resolver: zodResolver(ReportErrorSchema),
    defaultValues: {
      questionId,
    },
  })

  const { mutate, isPending } = useCreateQuestionErrorReport(
    { questionId },
    {
      onSuccess: () => {
        onOpenChange?.(false)
      },
    }
  )

  const handleCreateReport = useCallback(
    (data: ReportErrorFormData) => {
      mutate({
        status: "OPEN",
        ...data,
      })
    },
    [mutate]
  )

  return (
    <Dialog onOpenChange={onOpenChange} {...props}>
      <DialogContent>
        <DialogTitle>Report an error</DialogTitle>
        <DialogDescription>
          You can report any issues with the question here—whether it’s just a
          small typo or a completely incorrect answer. All feedback is welcome
          and appreciated.
        </DialogDescription>

        <form
          onSubmit={handleSubmit(handleCreateReport)}
          className="flex flex-col gap-4 mt-4"
          {...props}
        >
          <InputFormReady
            {...register("questionId")}
            required={isFieldRequired(ReportErrorSchema, "questionId")}
            type="text"
            label="Question ID"
            placeholder="The ID of the question you want to report an error for"
            className="w-full"
            aria-invalid={errors.questionId ? "true" : "false"}
            errorMessage={errors.questionId?.message}
            disabled
          />

          <TextareaFormReady
            {...register("content")}
            required={isFieldRequired(ReportErrorSchema, "content")}
            placeholder="Add a description of the error"
            label="Description of the error"
            errorMessage={errors.content?.message}
            aria-invalid={errors.content ? "true" : "false"}
          />
        <div className="flex flex-row items-center justify-end w-full mt-4 gap-2">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <LoadingButton type="submit" isLoading={isPending}>
            Send report
          </LoadingButton>
        </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
