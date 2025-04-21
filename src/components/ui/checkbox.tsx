"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { Label } from "./label"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

interface CheckboxFormReadyProps extends Omit<React.ComponentProps<typeof Checkbox>, "value"> {
  label?: string
  errorMessage?: string
}

const CheckboxFormReady = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxFormReadyProps
>(({ label, errorMessage, required, className, ...props }, ref) => {
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
      <Checkbox
        ref={ref}
        id={id}
        required={required}
        className={cn({ "mt-1.5": label }, className)}
        {...props}
      />
      {errorMessage && (
        <span className="ml-1 text-xs text-red-500">{errorMessage}</span>
      )}
    </div>
  )
})
CheckboxFormReady.displayName = "CheckboxFormReady"

export { Checkbox, CheckboxFormReady }
