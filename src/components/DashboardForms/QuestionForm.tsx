import {
  type OriginDetails,
  QuestionCreateSchema,
  QuestionTypeSchema,
} from "@/types/question"
import type { z } from "zod"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, type ComponentProps } from "react"
import { cn, isFieldRequired } from "@/lib/utils"
import { TextareaFormReady } from "@/components/ui/textarea"
import { InputFormReady } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/button"
import type { Paginated } from "@/types/pagination"
import type { ExtendedCourse } from "@/types/course"
import { ComboBoxFormReady } from "../ComboBoxFormReady/ComboBoxFormReady"
import { FreeTypeComboBoxFormReady } from "../FreeTypeComboBoxFormReady/FreeTypeComboBoxFormReady"

export type QuestionFormData = z.infer<typeof QuestionCreateSchema>

interface QuestionFormProps extends Omit<ComponentProps<"form">, "onSubmit"> {
  coursesData?: Paginated<ExtendedCourse>
  originsData?: OriginDetails[]
  submitButtonText?: string
  defaultValues?: Partial<QuestionFormData>
  submitIsLoading?: boolean
  deleteIsLoading?: boolean
  onSubmit: (data: QuestionFormData) => void
  onDelete?: () => void
}

export const QuestionForm = ({
  coursesData,
  originsData,
  submitButtonText = "Save",
  defaultValues,
  submitIsLoading = false,
  deleteIsLoading = false,
  onSubmit,
  onDelete,
  className,
  ...props
}: QuestionFormProps) => {
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuestionFormData>({
    resolver: zodResolver(QuestionCreateSchema),
    defaultValues,
  })

  const origin = watch("origin")

  // Labels are bound to the origin. If two questions have the same origin, but not the
  // same label, things go bad. Therefore just recommend the label of the origin
  // automatically.
  useEffect(() => {
    const label = originsData?.find((o) => o.origin === origin)?.label
    setValue("label", label ?? "")
  }, [origin, originsData, setValue])

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
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
            required={isFieldRequired(QuestionCreateSchema, "type")}
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
            required={isFieldRequired(QuestionCreateSchema, "courseId")}
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
            required={isFieldRequired(QuestionCreateSchema, "courseId")}
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
      <TextareaFormReady
        {...register("content")}
        required={isFieldRequired(QuestionCreateSchema, "content")}
        placeholder="Edit content"
        label="Content"
        errorMessage={errors.content?.message}
        aria-invalid={errors.content ? "true" : "false"}
      />
      <TextareaFormReady
        {...register("subContent")}
        required={isFieldRequired(QuestionCreateSchema, "subContent")}
        placeholder="Edit sub content"
        label="Sub content (only for SentenceSelect and SentenceFill)"
        errorMessage={errors.subContent?.message}
        aria-invalid={errors.subContent ? "true" : "false"}
      />
      <InputFormReady
        {...register("imagePath")}
        required={isFieldRequired(QuestionCreateSchema, "imagePath")}
        type="text"
        label="Image path"
        placeholder="Image path"
        className="w-full"
        aria-invalid={errors.imagePath ? "true" : "false"}
        errorMessage={errors.imagePath?.message}
      />
      <InputFormReady
        {...register("imageHeight", {
          setValueAs: (v) =>
            v === "" || v === null ? undefined : Number.parseInt(v, 10),
        })}
        required={isFieldRequired(QuestionCreateSchema, "imageHeight")}
        type="number"
        min={0}
        label="Image height (px) (ImageDragAndDrop only)"
        placeholder="Image height"
        className="w-full"
        aria-invalid={errors.imageHeight ? "true" : "false"}
        errorMessage={errors.imageHeight?.message}
      />
      <InputFormReady
        {...register("imageWidth", {
          setValueAs: (v) =>
            v === "" || v === null ? undefined : Number.parseInt(v, 10),
        })}
        required={isFieldRequired(QuestionCreateSchema, "imageWidth")}
        type="number"
        min={0}
        label="Image width (px) (ImageDragAndDrop only)"
        placeholder="Image width"
        className="w-full"
        aria-invalid={errors.imageWidth ? "true" : "false"}
        errorMessage={errors.imageWidth?.message}
      />
      <InputFormReady
        {...register("draggableWidth", {
          setValueAs: (v) =>
            v === "" || v === null ? undefined : Number.parseInt(v, 10),
        })}
        required={isFieldRequired(QuestionCreateSchema, "draggableWidth")}
        type="number"
        min={0}
        label="Draggable width (px) (ImageDragAndDrop only)"
        placeholder="Draggable width"
        className="w-full"
        aria-invalid={errors.draggableWidth ? "true" : "false"}
        errorMessage={errors.draggableWidth?.message}
      />
      <InputFormReady
        {...register("label")}
        required={isFieldRequired(QuestionCreateSchema, "label")}
        type="text"
        label="Label (don't change if you don't know what it is)"
        placeholder="Label"
        className="w-full"
        aria-invalid={errors.label ? "true" : "false"}
        errorMessage={errors.label?.message}
      />

      <div className="flex flex-row items-center gap-x-2">
        <LoadingButton
          type="submit"
          className="w-fit"
          isLoading={submitIsLoading}
        >
          {submitButtonText}
        </LoadingButton>
        {onDelete && (
          <LoadingButton
            type="button"
            variant="destructive"
            onClick={onDelete}
            className="w-fit"
            isLoading={deleteIsLoading}
          >
            Delete
          </LoadingButton>
        )}
      </div>
    </form>
  )
}
