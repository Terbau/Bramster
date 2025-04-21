import { forwardRef, type ComponentProps } from "react"
import { ComboBox } from "../ComboBox/ComboBox"
import { Label } from "../ui/label"
import type { ControllerRenderProps } from "react-hook-form"

interface ComboBoxFormReadyProps
  extends Omit<ComponentProps<typeof ComboBox>, "onValueChange"> {
  label?: string
  errorMessage?: string
  required?: boolean
  onChange?: ControllerRenderProps["onChange"]
}

export const ComboBoxFormReady = forwardRef<HTMLButtonElement, ComboBoxFormReadyProps>(({ label, errorMessage, required, onChange, ...props }, ref) => {
  return (
    <div>
      {label && (
        <span className="flex flex-row items-center gap-1">
          <Label>{label}</Label>
          {required && (
            <span className="text-red-500" aria-hidden="true">
              *
            </span>
          )}
        </span>
      )}
      <ComboBox ref={ref} onValueChange={onChange} {...props} />
      {errorMessage && (
        <span className="ml-1 text-xs text-red-500">{errorMessage}</span>
      )}
    </div>
  )
})
