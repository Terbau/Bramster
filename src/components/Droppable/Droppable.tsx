import { cn } from "@/lib/utils"
import { useDroppable } from "@dnd-kit/core"
import type { ComponentProps, CSSProperties } from "react"
import { Icon } from "@iconify/react"

interface DroppableProps extends ComponentProps<"li"> {
  id: string
  droppedId?: string | null
  isCorrect?: boolean
  showAnswer?: boolean
  allowRemove?: boolean
  minWidthPx?: number
  onRemove?: (id: string) => void
}

export const Droppable = ({
  id,
  droppedId,
  isCorrect,
  showAnswer = false,
  allowRemove = true,
  minWidthPx,
  onRemove,
  className,
  style,
  children,
  ...props
}: DroppableProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
  })

  const styles: CSSProperties = {
    ...style,
    minWidth: minWidthPx ? `${minWidthPx}px` : undefined,
  }

  return (
    <li
      ref={setNodeRef}
      className={cn(
        "min-w-32 w-fit text-xs sm:text-base h-4 sm:h-7 rounded-sm bg-slate-100 border border-dashed border-slate-300 whitespace-nowrap px-1 flex items-center justify-center relative",
        { "border-slate-400 bg-slate-200": isOver },
        { "bg-slate-200 border-solid": !!droppedId },
        { "pr-4": minWidthPx === undefined && !showAnswer && !!droppedId },
        { "-px-2": minWidthPx !== undefined && !!droppedId },
        { "border-green-400 bg-green-100": isCorrect && showAnswer },
        { "border-red-400 bg-red-100": !isCorrect && showAnswer },
        className
      )}
      style={styles}
      {...props}
    >
      {children}
      {droppedId && (
        <button
          type="button"
          className="absolute top-0.5 right-0.5 text-sm text-gray-500 hover:text-gray-700 z-20"
          onClick={() => onRemove?.(id)}
        >
          {allowRemove && (
            <>
              <span className="sr-only">Remove</span>
              <Icon icon="material-symbols:close-rounded" />
            </>
          )}
        </button>
      )}
    </li>
  )
}
