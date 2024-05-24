import type { FC, ReactNode } from "react"
import {
  TooltipProvider,
  Tooltip as OriginalTooltip,
  TooltipTrigger,
  TooltipContent,
} from "../ui/tooltip"

interface TooltipProps {
  text: string
  children: ReactNode
}

export const Tooltip: FC<TooltipProps> = ({ text, children }) => {
  return (
    <TooltipProvider>
      <OriginalTooltip>
        <TooltipTrigger>{children}</TooltipTrigger>
        <TooltipContent>{text}</TooltipContent>
      </OriginalTooltip>
    </TooltipProvider>
  )
}
