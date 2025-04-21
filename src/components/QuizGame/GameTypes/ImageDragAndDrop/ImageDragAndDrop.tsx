import { useEffect, useMemo, useRef, useState } from "react"
import type { GameTypeProps } from "../../QuizGame"
import Image from "next/image"
import { Draggable } from "@/components/Draggable/Draggable"
import { Droppable } from "@/components/Droppable/Droppable"
import { DndContext, type DragEndEvent } from "@dnd-kit/core"
import { shuffle } from "@/lib/utils"

export type DroppedItems = Record<string, string>

export interface ImageDragAndDropProps extends GameTypeProps {
  answeredDroppedItems: DroppedItems
  handleAnswer: (droppedItems: DroppedItems) => void
}

export const ImageDragAndDrop = ({
  question,
  showAnswer,
  navigateQuiz,
  handleAnswer,
  answeredDroppedItems,
}: ImageDragAndDropProps) => {
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [droppedItems, setDroppedItems] = useState<{
    [key: string]: string | null
  }>(
    Object.fromEntries(
      question.options.map((option) => [`droppable-${option.id}`, null])
    )
  )

  if (!question.imagePath) {
    throw new Error("Image path must not be null for Drag and Drop question")
  }

  const imageRef = useRef<HTMLImageElement>(null)
  const originalImageHeight = question.imageHeight ?? 0
  const originalImageWidth = question.imageWidth ?? 0

  if (originalImageHeight <= 0 || originalImageWidth <= 0) {
    throw new Error("Image height and width must be greater than 0")
  }

  const imageHeight = size.height
  const imageWidth = size.width
  const imageHeightRatio = originalImageHeight / imageHeight
  const imageWidthRatio = originalImageWidth / imageWidth

  const fixedAnsweredDroppedItems = Object.fromEntries(
    Object.entries(answeredDroppedItems).map(([key, value]) => [
      `droppable-${key}`,
      `draggable-${value}`,
    ])
  )

  const mappedOptions = useMemo(
    () =>
      Object.fromEntries(
        question.options.map((option) => [`draggable-${option.id}`, option])
      ),
    [question.options]
  )

  const randomOrderOptions = useMemo(
    () => shuffle(question.options),
    [question.options]
  )

  const allDroppableFilled = !Object.values(droppedItems).includes(null)

  const handleDragEnd = (event: DragEndEvent) => {
    const { over, active } = event

    if (over) {
      setDroppedItems((prev) => ({
        ...Object.fromEntries(
          // Remove the dropped item from the previous state if it exists
          Object.entries(prev).map(([key, value]) => [
            key,
            active.id === value ? null : value,
          ])
        ),
        [over.id]: active.id.toString(),
      }))
    }
  }

  const handleRemoveDropped = (id: string) => {
    setDroppedItems((prev) => ({
      ...prev,
      [id]: null,
    }))
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      if (showAnswer) {
        navigateQuiz(true)
        return
      }
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault()

      navigateQuiz(event.key === "ArrowRight")
      return
    }
  }

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    const updateSize = () => {
      if (imageRef.current) {
        const rect = imageRef.current.getBoundingClientRect()
        setSize({ width: rect.width, height: rect.height })
      }
    }

    // Call once after image has loaded
    const img = imageRef.current
    if (img?.complete) {
      updateSize()
    } else {
      img?.addEventListener("load", updateSize)
      return () => img?.removeEventListener("load", updateSize)
    }
  }, [])

  useEffect(() => {
    if (allDroppableFilled) {
      const fixedDroppedItems = Object.fromEntries(
        Object.entries(droppedItems).map(([key, value]) => [
          key.replace("droppable-", ""),
          value?.replace("draggable-", ""),
        ])
      )
      handleAnswer(fixedDroppedItems as DroppedItems) // Values cannot be null as allDroppableFilled is true
    }
  }, [allDroppableFilled, droppedItems, handleAnswer])

  return (
    <div className="mt-4 flex flex-col gap-y-3">
      <DndContext onDragEnd={handleDragEnd}>
        {!showAnswer && (
          <ul className="flex flex-wrap gap-2 ">
            {randomOrderOptions
              .filter(
                (option) =>
                  !Object.values(droppedItems).includes(
                    `draggable-${option.id}`
                  )
              )
              .map((option) => (
                <li key={option.id} className="z-10">
                  <Draggable
                    id={`draggable-${option.id}`}
                    className="z-10"
                    widthPx={
                      question.draggableWidth
                        ? Math.floor(question.draggableWidth / imageWidthRatio)
                        : undefined
                    }
                  >
                    {option.content}
                  </Draggable>
                </li>
              ))}
          </ul>
        )}
        <div className="relative">
          <Image
            ref={imageRef}
            src={`/uploads/${question.imagePath}`}
            alt=""
            height={originalImageHeight}
            width={originalImageWidth}
            className="object-contain max-h-[32rem] w-fit"
          />
          <ul className="absolute top-0 left-0">
            {question.options.map((option) => {
              const droppableId = `droppable-${option.id}`
              const droppedId = (
                showAnswer ? fixedAnsweredDroppedItems : droppedItems
              )[droppableId]
              const droppedItem = mappedOptions[droppedId ?? ""]

              return (
                <Droppable
                  key={option.id}
                  id={droppableId}
                  droppedId={droppedId}
                  allowRemove={!showAnswer}
                  onRemove={handleRemoveDropped}
                  isCorrect={droppedItem?.id === option.id}
                  showAnswer={showAnswer}
                  className="absolute"
                  minWidthPx={
                    question.draggableWidth
                      ? Math.floor(question.draggableWidth / imageWidthRatio)
                      : undefined
                  }
                  style={{
                    top: `${Math.floor(
                      (option.yCoordinate ?? 0) / imageHeightRatio
                    )}px`,
                    left: `${Math.floor(
                      (option.xCoordinate ?? 0) / imageWidthRatio
                    )}px`,
                  }}
                >
                  {droppedItem && !showAnswer && (
                    <Draggable
                      id={`draggable-${droppedItem.id}`}
                      className="z-20"
                      isDropped
                      widthPx={
                        question.draggableWidth
                          ? Math.floor(
                              question.draggableWidth / imageWidthRatio
                            )
                          : undefined
                      }
                    >
                      {droppedItem.content}
                    </Draggable>
                  )}
                  {droppedItem && showAnswer && (
                    <span>{droppedItem.content}</span>
                  )}
                </Droppable>
              )
            })}
          </ul>
        </div>
      </DndContext>
    </div>
  )
}
