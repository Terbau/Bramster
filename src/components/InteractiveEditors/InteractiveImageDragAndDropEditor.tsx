import type { QuestionOption } from "@/types/question"
import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { DndContext } from "@dnd-kit/core"
import { Icon } from "@iconify/react/dist/iconify.js"
import { DraggableInput } from "../DraggableInput/DraggableInput"
import { Button, LoadingButton } from "../ui/button"
import type { EditorQuestionOption } from "."

interface InteractiveImageDragAndDropEditorProps {
  questionId: string
  imagePath: string
  imageHeight?: number | null
  imageWidth?: number | null
  draggableWidth?: number | null
  existingOptions?: QuestionOption[]
  saveIsPending?: boolean
  onSave?: (options: EditorQuestionOption[]) => void
}

export const InteractiveImageDragAndDropEditor = ({
  questionId,
  imagePath,
  imageHeight: originalImageHeight = 0,
  imageWidth: originalImageWidth = 0,
  draggableWidth,
  existingOptions = [],
  saveIsPending = false,
  onSave,
}: InteractiveImageDragAndDropEditorProps) => {
  const imageRef = useRef<HTMLImageElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  const [options, setOptions] = useState<EditorQuestionOption[]>(
    existingOptions.map((option) => ({
      ...option,
      isNew: false,
    }))
  )

  if (imagePath === "") {
    throw new Error("Image path is required")
  }

  const imageHeight = size.height
  const imageWidth = size.width
  const imageHeightRatio = (originalImageHeight ?? 0) / imageHeight
  const imageWidthRatio = (originalImageWidth ?? 0) / imageWidth

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

  const handleTransform = (
    optionId: QuestionOption["id"],
    x: number,
    y: number
  ) => {
    const newOptions = options.map((opt) => {
      if (opt.id === optionId) {
        const newX = Math.floor((opt.xCoordinate ?? 0) / imageWidthRatio) + x
        const newY = Math.floor((opt.yCoordinate ?? 0) / imageHeightRatio) + y

        return {
          ...opt,
          xCoordinate: Math.floor(newX * imageWidthRatio),
          yCoordinate: Math.floor(newY * imageHeightRatio),
        }
      }
      return opt
    })
    setOptions(newOptions)
  }

  const handleInputChange = (optionId: QuestionOption["id"], value: string) => {
    const newOptions = options.map((opt) => {
      if (opt.id === optionId) {
        return {
          ...opt,
          content: value,
        }
      }
      return opt
    })
    setOptions(newOptions)
  }

  const handleCreateOption = () => {
    const newOption: EditorQuestionOption = {
      id: crypto.randomUUID(), // Will be replaced with a real ID from the server when actually created
      content: "",
      xCoordinate: 20, // Default position
      yCoordinate: 20, // Default position
      isNew: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      questionId,
      correct: true,
    }
    setOptions((prev) => [...prev, newOption])
  }

  const handleDeleteOption = (optionId: QuestionOption["id"]) => {
    setOptions((prev) => prev.filter((opt) => opt.id !== optionId))
  }

  const handleRevert = () => {
    setOptions(
      existingOptions.map((option) => ({
        ...option,
        isNew: false,
      }))
    )
  }

  return (
    <div className="border-t border-input pt-2">
      <Button variant="outline" onClick={handleCreateOption}>
        <Icon icon="mdi:add" className="mr-1" />
        Add Option
      </Button>
      <div className="relative my-2 border border-input w-fit shadow-md">
        <DndContext
          onDragEnd={(event) =>
            handleTransform(
              event.active.id.toString().split(";")[1],
              event.delta.x,
              event.delta.y
            )
          }
        >
          <Image
            ref={imageRef}
            src={`/uploads/${imagePath}`}
            alt=""
            height={originalImageHeight ?? 0}
            width={originalImageWidth ?? 0}
            className="object-contain max-h-[32rem] w-fit"
          />
          <ul className="absolute top-0 left-0 z-10">
            {options.map((option) => {
              const top = Math.floor(
                (option.yCoordinate ?? 0) / imageHeightRatio
              )
              const left = Math.floor(
                (option.xCoordinate ?? 0) / imageWidthRatio
              )
              return (
                <li
                  key={option.id}
                  className="absolute z-10"
                  style={{ left: `${left}px`, top: `${top}px` }}
                >
                  <DraggableInput
                    type="text"
                    id={`draggable;${option.id}`}
                    className="focus-visible:ring-offset-0 h-8"
                    value={option.content}
                    placeholder="Content"
                    widthPx={
                      draggableWidth
                        ? Math.floor(draggableWidth / imageWidthRatio)
                        : undefined
                    }
                    onChange={(e) =>
                      handleInputChange(option.id, e.target.value)
                    }
                    onDelete={() => handleDeleteOption(option.id)}
                  />
                </li>
              )
            })}
          </ul>
        </DndContext>
      </div>
      <div className="flex flex-row gap-2 mt-2">
        <LoadingButton
          onClick={() => onSave?.(options)}
          isLoading={saveIsPending}
        >
          Save
        </LoadingButton>
        <Button variant="outline" onClick={handleRevert}>
          Revert
        </Button>
      </div>
    </div>
  )
}
