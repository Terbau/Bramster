import { forwardRef, type ComponentProps, type CSSProperties } from "react"
import { useDraggable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import composeRefs from "@seznam/compose-react-refs"

interface DraggableProps extends ComponentProps<"button"> {
  id: string
  isDropped?: boolean
  widthPx?: number
}

export const Draggable = forwardRef<HTMLButtonElement, DraggableProps>(
  ({ id, isDropped = false, widthPx, className, children, style, ...props }, ref) => {
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
      width: widthPx ? `${widthPx}px` : undefined,
    }

    return (
      <button
        ref={composeRefs<HTMLButtonElement>(setNodeRef, ref)}
        className={cn(
          "px-1 bg-slate-200 border border-slate-300 rounded-sm w-fit cursor-grab text-xs break-all sm:text-base",
          { "border-none px-0 w-full bg-transparent": isDropped },
          { "cursor-grabbing px-1 border-solid z-30": isDragging },
          className
        )}
        style={newStyles}
        {...listeners}
        {...attributes}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Draggable.displayName = "Draggable"