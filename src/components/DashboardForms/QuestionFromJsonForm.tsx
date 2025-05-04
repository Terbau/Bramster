import type { ComponentProps } from "react"
import { TextareaFormReady } from "../ui/textarea"
import {
  QuestionCreateSchema,
  QuestionTypeSchema,
  type OriginDetails,
} from "@/types/question"
import type { Paginated } from "@/types/pagination"
import type { ExtendedCourse } from "@/types/course"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { cn, isFieldRequired } from "@/lib/utils"
import { ComboBoxFormReady } from "../ComboBoxFormReady/ComboBoxFormReady"
import { FreeTypeComboBoxFormReady } from "../FreeTypeComboBoxFormReady/FreeTypeComboBoxFormReady"
import { LoadingButton } from "../ui/button"
import { InputFormReady } from "../ui/input"

export const QuestionFromJsonSchema = z.object({
  content: z.string(),
  options: z.array(
    z.object({
      content: z.string(),
      correct: z.boolean(),
    })
  ),
})

const QuestionFromJsonFormDataSchema = QuestionCreateSchema.pick({
  type: true,
  courseId: true,
  origin: true,
  label: true,
}).extend({
  jsonContents: z.string().refine(
    (val) => {
      try {
        QuestionFromJsonSchema.array().parse(JSON.parse(val))
        return true
      } catch (e) {
        return false
      }
    },
    {
      message: "Invalid JSON format or structure",
    }
  ),
})

export type QuestionFromJsonFormData = z.infer<
  typeof QuestionFromJsonFormDataSchema
>

interface QuestionFromJsonFormProps
  extends Omit<ComponentProps<"form">, "onSubmit" | "onChange"> {
  coursesData?: Paginated<ExtendedCourse>
  originsData?: OriginDetails[]
  submitButtonText?: string
  defaultValues?: Partial<QuestionFromJsonFormData>
  submitIsLoading?: boolean
  onSubmit?: (data: QuestionFromJsonFormData) => void
  onChange?: (data: QuestionFromJsonFormData) => void
}

export const QuestionFromJsonForm = ({
  coursesData,
  originsData,
  submitButtonText,
  defaultValues,
  submitIsLoading,
  onSubmit,
  className,
  onChange,
  ...props
}: QuestionFromJsonFormProps) => {
  const {
    control,
    register,
    handleSubmit,
    getValues,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuestionFromJsonFormData>({
    resolver: zodResolver(QuestionFromJsonFormDataSchema),
    defaultValues,
  })

  return (
    <form
      onSubmit={handleSubmit(onSubmit ?? (() => {}))}
      className={cn("flex flex-col gap-4 mt-4", className)}
      {...props}
    >
      <Controller
        name="type"
        control={control}
        rules={{ required: "Please select a type" }}
        render={({ field }) => (
          <ComboBoxFormReady
            {...field}
            label="Type"
            required={isFieldRequired(QuestionFromJsonFormDataSchema, "type")}
            errorMessage={errors.type?.message}
            items={
              QuestionTypeSchema.options.map((type) => ({
                label: type,
                value: type,
              })) ?? []
            }
          />
        )}
      />
      <Controller
        name="courseId"
        control={control}
        rules={{ required: "Please select a course" }}
        render={({ field }) => (
          <ComboBoxFormReady
            {...field}
            label="Course"
            required={isFieldRequired(
              QuestionFromJsonFormDataSchema,
              "courseId"
            )}
            errorMessage={errors.courseId?.message}
            items={
              coursesData?.results.map((course) => ({
                label: course.name,
                value: course.id,
              })) ?? []
            }
          />
        )}
      />
      <Controller
        name="origin"
        control={control}
        rules={{ required: "Please select a origin" }}
        render={({ field }) => (
          <FreeTypeComboBoxFormReady
            {...field}
            label="Origin"
            required={isFieldRequired(
              QuestionFromJsonFormDataSchema,
              "courseId"
            )}
            errorMessage={errors.courseId?.message}
            items={
              originsData?.map((origin) => ({
                label: origin.origin,
                value: origin.origin,
              })) ?? []
            }
          />
        )}
      />
      <InputFormReady
        {...register("label")}
        required={isFieldRequired(QuestionFromJsonFormDataSchema, "label")}
        type="text"
        label="Label (don't change if you don't know what it is)"
        placeholder="Label"
        className="w-full"
        aria-invalid={errors.label ? "true" : "false"}
        errorMessage={errors.label?.message}
      />

      <TextareaFormReady
        {...register("jsonContents")}
        required={isFieldRequired(
          QuestionFromJsonFormDataSchema,
          "jsonContents"
        )}
        placeholder="Edit json contents"
        label="JSON contents"
        errorMessage={errors.jsonContents?.message}
        aria-invalid={errors.jsonContents ? "true" : "false"}
      />

      {onSubmit && (
        <div className="flex flex-row items-center gap-x-2">
          <LoadingButton
            type="submit"
            className="w-fit"
            isLoading={submitIsLoading}
          >
            {submitButtonText}
          </LoadingButton>
        </div>
      )}
    </form>
  )
}
