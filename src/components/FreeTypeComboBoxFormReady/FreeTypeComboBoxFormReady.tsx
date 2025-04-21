import { forwardRef, type ComponentProps } from "react"
import { FreeTypeComboBox } from "../FreeTypeComboBox/FreeTypeComboBox"
import { Label } from "../ui/label"
import type { ControllerRenderProps } from "react-hook-form"

interface FreeTypeComboBoxFormReadyProps
  extends Omit<ComponentProps<typeof FreeTypeComboBox>, "onValueChange"> {
  label?: string
  errorMessage?: string
  required?: boolean
  onChange?: ControllerRenderProps["onChange"]
}

export const FreeTypeComboBoxFormReady = forwardRef<
  HTMLButtonElement,
  FreeTypeComboBoxFormReadyProps
>(({ label, errorMessage, required, onChange, ...props }, ref) => {
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
      <FreeTypeComboBox onValueChange={onChange} ref={ref} {...props} />
      {errorMessage && (
        <span className="ml-1 text-xs text-red-500">{errorMessage}</span>
      )}
    </div>
  )
})

FreeTypeComboBoxFormReady.displayName = "FreeTypeComboBoxFormReady"
