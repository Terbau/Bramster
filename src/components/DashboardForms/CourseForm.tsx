import type { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { ComponentProps } from "react"
import { cn, isFieldRequired } from "@/lib/utils"
import { InputFormReady } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/button"
import { CourseCreateSchema } from "@/types/course"

export type CourseFormData = z.infer<typeof CourseCreateSchema>

interface CourseFormProps extends Omit<ComponentProps<"form">, "onSubmit"> {
  submitButtonText?: string
  defaultValues?: CourseFormData
  submitIsLoading?: boolean
  deleteIsLoading?: boolean
  onSubmit: (data: CourseFormData) => void
  onDelete?: () => void
}

export const CourseForm = ({
  submitButtonText = "Save",
  defaultValues,
  submitIsLoading = false,
  deleteIsLoading = false,
  onSubmit,
  onDelete,
  className,
  ...props
}: CourseFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CourseFormData>({
    resolver: zodResolver(CourseCreateSchema),
    defaultValues,
  })

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("flex flex-col gap-4 mt-4", className)}
      {...props}
    >
      <InputFormReady
        {...register("id")}
        required={isFieldRequired(CourseCreateSchema, "id")}
        type="text"
        label="ID (NTNU ID)"
        placeholder="ID"
        className="w-full"
        aria-invalid={errors.id ? "true" : "false"}
        errorMessage={errors.id?.message}
      />
      <InputFormReady
        {...register("name")}
        required={isFieldRequired(CourseCreateSchema, "name")}
        type="text"
        label="Name"
        placeholder="Name"
        className="w-full"
        aria-invalid={errors.name ? "true" : "false"}
        errorMessage={errors.name?.message}
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
