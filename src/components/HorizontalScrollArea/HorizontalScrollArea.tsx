import {
  type ComponentProps,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { ScrollArea, ScrollBar } from "../ui/scroll-area"
import { cn } from "@/lib/utils"

export const HorizontalScrollArea = ({
  className,
  children,
  ...props
}: ComponentProps<"div">) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Check scroll possibilities
  const checkScrollability = useCallback(() => {
    // We need to check the viewport div which is the actual scrollable element
    const viewport = viewportRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement | null

    if (!viewport) return

    const hasHorizontalOverflow = viewport.scrollWidth > viewport.clientWidth
    const atLeftEdge = viewport.scrollLeft <= 0
    const atRightEdge =
      viewport.scrollLeft + viewport.clientWidth >= viewport.scrollWidth - 1

    setCanScrollLeft(hasHorizontalOverflow && !atLeftEdge)
    setCanScrollRight(hasHorizontalOverflow && !atRightEdge)
  }, [])

  useEffect(() => {
    setTimeout(checkScrollability, 100)

    const viewport = viewportRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement | null

    if (viewport) {
      viewport.addEventListener("scroll", checkScrollability)

      const resizeObserver = new ResizeObserver(() => {
        checkScrollability()
      })

      resizeObserver.observe(viewport)

      return () => {
        viewport.removeEventListener("scroll", checkScrollability)
        resizeObserver.disconnect()
      }
    }
  }, [checkScrollability])

  return (
    <div
      ref={containerRef}
      className={cn("relative", className)}
      {...props}
    >
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none bg-gradient-to-r from-white to-transparent" />
      )}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none bg-gradient-to-l from-white to-transparent" />
      )}
      <div ref={viewportRef}>
        <ScrollArea>
          {children}
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  )
}
