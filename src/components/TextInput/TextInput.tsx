import { cn } from "@/lib/utils"
import type { ComponentProps } from "react"

interface TextInputProps extends ComponentProps<"input"> {
  className?: string
}

export const TextInput = ({ className, ...props }: TextInputProps) => {
  return (
    <input
      type="text"
      className={cn("border border-slate-400 rounded-sm px-2 py-1", className)}
      {...props}
    />
  )
}
