import { type RefObject, createRef, useRef } from "react"
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { cn } from "@/lib/utils"

export interface CardButton<T> {
  label: string
  value: T
  description?: string
}

interface CardButtonGroupProps<T> {
  cards: CardButton<T>[]
  value: T
  onChange?: (value: T) => void
}

export const CardButtonGroup = <T,>({
  cards,
  value,
  onChange,
}: CardButtonGroupProps<T>) => {
  const ref = useRef<RefObject<HTMLButtonElement>[]>(
    cards.map(() => createRef<HTMLButtonElement>())
  )

  return (
    <div className="grid auto-cols-fr md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {cards.map((card, index) => (
        <button
          type="button"
          key={String(card.value)}
          ref={ref.current[index]}
          onClick={() => onChange?.(card.value)}
          className="h-full"
        >
          <Card
            className={cn("h-full flex flex-col justify-center", {
              "border bg-gray-50 border-primary": card.value === value,
            })}
          >
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">{card.label}</CardTitle>
              {card.description && (
                <CardDescription>{card.description}</CardDescription>
              )}
            </CardHeader>
          </Card>
        </button>
      ))}
    </div>
  )
}
