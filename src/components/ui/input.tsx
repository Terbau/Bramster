import * as React from "react"

import { cn } from "@/lib/utils"
import { Label } from "./label"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

interface InputFormReadyProps extends React.ComponentProps<typeof Input> {
  label?: string
  errorMessage?: string
}

const InputFormReady = React.forwardRef<HTMLInputElement, InputFormReadyProps>(
  ({ label, errorMessage, className, required, ...props }, ref) => {
    const id = React.useId()
    return (
      <div>
        {label && (
          <span className="flex flex-row items-center gap-1">
            <Label htmlFor={id}>{label}</Label>
            {required && (
              <span className="text-red-500" aria-hidden="true">
                *
              </span>
            )}
          </span>
        )}
        <Input
          ref={ref}
          id={id}
          required={required}
          className={cn("h-10", { "mt-1.5": label }, className)}
          {...props}
        />
        {errorMessage && (
          <span className="ml-1 text-xs text-red-500">{errorMessage}</span>
        )}
      </div>
    )
  }
)
InputFormReady.displayName = "InputFormReady"

export { Input, InputFormReady }
