import * as React from "react"

import { cn } from "@/lib/utils"
import { Label } from "./label"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

interface TextareaFormReadyProps extends React.ComponentProps<typeof Textarea> {
  label?: string
  errorMessage?: string
}

const TextareaFormReady = React.forwardRef<
  HTMLTextAreaElement,
  TextareaFormReadyProps
>(({ required, label, errorMessage, className, ...props }, ref) => {
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
      <Textarea
        ref={ref}
        id={id}
        required={required}
        className={cn("h-20 resize-none", { "mt-1.5": label }, className)}
        {...props}
      />
      {errorMessage && (
        <span className="ml-1 text-xs text-red-500">{errorMessage}</span>
      )}
    </div>
  )
})

export { Textarea, TextareaFormReady }
