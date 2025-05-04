import { QuestionOptionCreateSchema } from "@/types/question"
import type { z } from "zod"
import { Controller, useForm, type UseFormGetValues } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  type ComponentProps,
} from "react"
import { cn, isFieldRequired } from "@/lib/utils"
import { TextareaFormReady } from "@/components/ui/textarea"
import { InputFormReady } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/button"
import { CheckboxFormReady } from "../ui/checkbox"
import { ConfirmModal } from "../ConfirmModal/ConfirmModal"

export type QuestionOptionFormData = z.infer<typeof QuestionOptionCreateSchema>

interface QuestionOptionFormProps
  extends Omit<ComponentProps<"form">, "onSubmit" | "onChange"> {
  submitButtonText?: string
  defaultValues?: Partial<QuestionOptionFormData>
  submitIsLoading?: boolean
  deleteIsLoading?: boolean
  onSubmit?: (data: QuestionOptionFormData) => void
  onDelete?: () => void
  onChange?: (data: QuestionOptionFormData) => void
}

export type QuestionOptionFormHandle = {
  getValues: UseFormGetValues<QuestionOptionFormData>
}

export const QuestionOptionForm = forwardRef<
  QuestionOptionFormHandle,
  QuestionOptionFormProps
>(
  (
    {
      submitButtonText = "Save",
      defaultValues,
      submitIsLoading = false,
      deleteIsLoading = false,
      onSubmit,
      onDelete,
      onChange,
      className,
      ...props
    },
    ref
  ) => {
    const [confirmModalOpen, setConfirmModalOpen] = useState(false)

    const {
      control,
      register,
      handleSubmit,
      watch,
      getValues,
      formState: { errors },
    } = useForm<QuestionOptionFormData>({
      resolver: zodResolver(QuestionOptionCreateSchema),
      defaultValues: {
        ...defaultValues,
        correct: defaultValues?.correct ?? false,
      },
    })

    const values = watch()

    useImperativeHandle(ref, () => ({
      getValues,
    }))

    useEffect(() => {
      if (onChange) {
        onChange(values)
      }
    }, [values, onChange])

    return (
      <>
        <ConfirmModal
          open={confirmModalOpen}
          onOpenChange={setConfirmModalOpen}
          onConfirm={() => onDelete?.()}
          onCancel={() => setConfirmModalOpen(false)}
          isLoading={deleteIsLoading}
          description="Are you sure you want to delete this question option?"
        />
        <form
          onSubmit={handleSubmit(onSubmit ?? (() => {}))}
          className={cn("flex flex-col gap-4 mt-4", className)}
          {...props}
        >
          <InputFormReady
            {...register("questionId")}
            required={isFieldRequired(QuestionOptionCreateSchema, "questionId")}
            placeholder="Question ID"
            label="Question ID"
            errorMessage={errors.questionId?.message}
            aria-invalid={errors.questionId ? "true" : "false"}
            disabled
          />
          <Controller
            name="correct"
            control={control}
            render={({ field }) => (
              <CheckboxFormReady
                {...field}
                checked={field.value ?? false}
                onCheckedChange={field.onChange}
                label="Correct"
                errorMessage={errors.correct?.message}
                aria-invalid={errors.correct ? "true" : "false"}
              />
            )}
          />
          <TextareaFormReady
            {...register("content")}
            required={isFieldRequired(QuestionOptionCreateSchema, "content")}
            placeholder="Content"
            label="Content"
            errorMessage={errors.content?.message}
            aria-invalid={errors.content ? "true" : "false"}
          />
          <TextareaFormReady
            {...register("yContent")}
            required={isFieldRequired(QuestionOptionCreateSchema, "yContent")}
            placeholder="Content"
            label="Y Content (Matrix only)"
            errorMessage={errors.yContent?.message}
            aria-invalid={errors.yContent ? "true" : "false"}
          />
          <InputFormReady
            {...register("xCoordinate", {
              setValueAs: (v) =>
                v === "" || v === null ? undefined : Number.parseInt(v, 10),
            })}
            required={isFieldRequired(
              QuestionOptionCreateSchema,
              "xCoordinate"
            )}
            type="number"
            min={0}
            label="X Coordinate (px)"
            placeholder="xCoordinate"
            className="w-full"
            aria-invalid={errors.xCoordinate ? "true" : "false"}
            errorMessage={errors.xCoordinate?.message}
          />
          <InputFormReady
            {...register("yCoordinate", {
              setValueAs: (v) =>
                v === "" || v === null ? undefined : Number.parseInt(v, 10),
            })}
            required={isFieldRequired(
              QuestionOptionCreateSchema,
              "yCoordinate"
            )}
            type="number"
            min={0}
            label="Y Coordinate (px)"
            placeholder="yCoordinate"
            className="w-full"
            aria-invalid={errors.yCoordinate ? "true" : "false"}
            errorMessage={errors.yCoordinate?.message}
          />

          {(onSubmit || onDelete) && (
            <div className="flex flex-row items-center gap-x-2">
              {onSubmit && (
                <LoadingButton
                  type="submit"
                  className="w-fit"
                  isLoading={submitIsLoading}
                >
                  {submitButtonText}
                </LoadingButton>
              )}
              {onDelete && (
                <LoadingButton
                  type="button"
                  variant="destructive"
                  onClick={() => setConfirmModalOpen(true)}
                  className="w-fit"
                >
                  Delete
                </LoadingButton>
              )}
            </div>
          )}
        </form>
      </>
    )
  }
)
