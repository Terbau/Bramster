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
    <div className="flex flex-wrap gap-6">
      {cards.map((card, index) => (
        <button
          type="button"
          key={String(card.value)}
          ref={ref.current[index]}
          onClick={() => onChange?.(card.value)}
        >
          <Card
            className={cn({
              "bg-primary text-primary-foreground": card.value === value,
            })}
          >
            <CardHeader>
              <CardTitle>{card.label}</CardTitle>
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
