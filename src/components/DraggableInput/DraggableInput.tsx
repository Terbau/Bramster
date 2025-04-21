import type { ComponentProps, CSSProperties } from "react"
import { useDraggable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import { Icon } from "@iconify/react/dist/iconify.js"
import { Input } from "../ui/input"

interface DraggableInputProps
  extends Omit<ComponentProps<typeof Input>, "children"> {
  id: string
  isDropped?: boolean
  widthPx?: number
  onDelete?: () => void
}

export const DraggableInput = ({
  id,
  isDropped = false,
  widthPx,
  onDelete,
  className,
  style,
  ...props
}: DraggableInputProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id,
    })

  const transformStyle = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  const newStyles: CSSProperties = {
    ...style,
    ...transformStyle,
  }

  return (
    <span
      ref={setNodeRef}
      style={newStyles}
      className="flex flex-row items-center gap-1"
    >
      <Input
        className={cn("w-fit", className)}
        style={{
          width: widthPx ? `${widthPx}px` : undefined,
        }}
        {...props}
      />
      <Icon
        {...listeners}
        {...attributes}
        icon="mdi:drag"
        className={cn("text-slate-500 cursor-grab", {
          "cursor-grabbing border-solid z-30": isDragging,
        })}
      />
      <Icon
        icon="mdi:delete-outline"
        className="text-red-500 cursor-pointer"
        onClick={onDelete}
      />
    </span>
  )
}
