import type { QuestionOption } from "@/types/question"
import { useEffect, useMemo, useState } from "react"
import { Button, LoadingButton } from "../ui/button"
import type { EditorQuestionOption } from "."
import { RadioGroup, RadioGroupItem } from "../ui/radio-group"
import { cn } from "@/lib/utils"
import { Input } from "../ui/input"
import { Icon } from "@iconify/react/dist/iconify.js"
import { useToast } from "../ui/use-toast"

interface InteractiveMatrixEditorProps {
  questionId: string
  existingOptions?: QuestionOption[]
  saveIsPending?: boolean
  onSave?: (options: EditorQuestionOption[]) => void
}

export const InteractiveMatrixEditor = ({
  questionId,
  existingOptions = [],
  saveIsPending = false,
  onSave,
}: InteractiveMatrixEditorProps) => {
  const { toast } = useToast()

  const [options, setOptions] = useState<EditorQuestionOption[]>(
    existingOptions.map((option) => ({
      ...option,
      isNew: false,
    }))
  )

  const xArray = useMemo(() => {
    return Array.from(new Set<string>(options.map((option) => option.content)))
  }, [options])
  const yArray = useMemo(() => {
    return Array.from(
      new Set<string>(options.map((option) => option.yContent ?? ""))
    )
  }, [options])

  useEffect(() => {
    setOptions(
      existingOptions.map((option) => ({
        ...option,
        isNew: false,
      }))
    )
  }, [existingOptions])

  const [existsDimArray] = useMemo(() => {
    const xLen = xArray.length
    const yLen = yArray.length

    const arrExists: boolean[][] = Array.from({ length: yLen }, () =>
      Array.from({ length: xLen }, () => false)
    )
    const arrAnswer: boolean[][] = Array.from({ length: yLen }, () =>
      Array.from({ length: xLen }, () => false)
    )

    // Fill every spot with true if the option is present
    for (const option of options) {
      const xIndex = xArray.indexOf(option.content)
      const yIndex = yArray.indexOf(option.yContent ?? "")
      arrExists[yIndex][xIndex] = true
      arrAnswer[yIndex][xIndex] = option.correct
    }

    return [arrExists, arrAnswer]
  }, [options, xArray, yArray])

  const handleCheckedChange = (value: string) => {
    const selectedOption = options.find((o) => o.id === value)
    if (!selectedOption) {
      throw new Error("Selected option not found")
    }

    setOptions((prev) =>
      prev.map((opt) => ({
        ...opt,
        correct:
          selectedOption.yContent === opt.yContent
            ? opt.id === value
            : opt.correct,
      }))
    )
  }

  const handleCreateOption = (xContent: string, yContent: string) => {
    const newOption: EditorQuestionOption = {
      id: crypto.randomUUID(), // Will be replaced with a real ID from the server when actually created
      content: xContent,
      yContent: yContent,
      isNew: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      questionId,
      correct: true,
    }
    setOptions((prev) => [...prev, newOption])
  }

  const handleCreateRow = () => {
    if (xArray.length === 0 && yArray.length === 0) {
      handleCreateOption("", "")
      return
    }

    if (yArray.includes("")) {
      toast({
        title: "Error",
        description: "Please fill all the row names before adding a new row.",
        variant: "destructive",
      })
      return
    }

    const colsAmount = xArray.length
    const newOptions: EditorQuestionOption[] = Array.from(
      { length: colsAmount },
      (_, xIndex) => ({
        id: crypto.randomUUID(),
        content: xArray[xIndex],
        yContent: "",
        isNew: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        questionId,
        correct: false,
      })
    )
    setOptions((prev) => [...prev, ...newOptions])
  }

  const handleCreateColumn = () => {
    if (xArray.length === 0 && yArray.length === 0) {
      handleCreateOption("", "")
      return
    }

    if (xArray.includes("")) {
      toast({
        title: "Error",
        description:
          "Please fill all the column names before adding a new column.",
        variant: "destructive",
      })
      return
    }
    const rowsAmount = yArray.length
    const newOptions: EditorQuestionOption[] = Array.from(
      { length: rowsAmount },
      (_, yIndex) => ({
        id: crypto.randomUUID(),
        content: "",
        yContent: yArray[yIndex],
        isNew: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        questionId,
        correct: false,
      })
    )
    setOptions((prev) => [...prev, ...newOptions])
  }

  const handleDeleteOption = (optionId: QuestionOption["id"]) => {
    setOptions((prev) => prev.filter((opt) => opt.id !== optionId))
  }

  const handleXValueChange = (xIndex: number, value: string) => {
    setOptions((prev) =>
      prev.map((opt) => ({
        ...opt,
        content: opt.content === xArray[xIndex] ? value : opt.content,
      }))
    )
  }

  const handleYValueChange = (yIndex: number, value: string) => {
    setOptions((prev) =>
      prev.map((opt) => ({
        ...opt,
        yContent: opt.yContent === yArray[yIndex] ? value : opt.yContent,
      }))
    )
  }

  const handleSave = () => {
    if (options.some((opt) => opt.yContent === "")) {
      toast({
        title: "Error",
        description: "Please fill all the row names before saving.",
        variant: "destructive",
      })
      return
    }
    if (options.some((opt) => opt.content === "")) {
      toast({
        title: "Error",
        description: "Please fill all the column names before saving.",
        variant: "destructive",
      })
      return
    }
    if (
      !yArray.every((y) =>
        options.some((opt) => opt.yContent === y && opt.correct)
      )
    ) {
      toast({
        title: "Error",
        description: "Please select an option for each row before saving.",
        variant: "destructive",
      })
      return
    }

    onSave?.(options)
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
    <div className="border-t border-input pt-4 ">
      <div className="border border-input w-fit shadow-md p-4 rounded-sm">
        <div className="flex flex-row gap-0.5">
          <table className="border-collapse table-auto">
            <thead>
              <tr>
                <th className="text-center" />
                {xArray.map((x, xIndex) => (
                  <th
                    key={`x-${xIndex + 1}`}
                    className="text-center font-normal"
                  >
                    <Input
                      className="w-[6.72rem] focus-visible:ring-offset-0 mb-2"
                      value={x}
                      onChange={(e) =>
                        handleXValueChange(xIndex, e.target.value)
                      }
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {yArray.map((yValue, yIndex) => (
                <RadioGroup
                  asChild
                  key={`y-${yIndex + 1}`}
                  className="table-row"
                  value={
                    options.find(
                      (opt) => opt.yContent === yValue && opt.correct
                    )?.id ?? ""
                  }
                  onValueChange={(value) => handleCheckedChange(value)}
                >
                  <tr>
                    <td className="text-center pr-2">
                      <Input
                        className="w-[6.72rem] focus-visible:ring-offset-0"
                        value={yArray[yIndex]}
                        onChange={(e) =>
                          handleYValueChange(yIndex, e.target.value)
                        }
                      />
                    </td>
                    {xArray.map((_, xIndex) => {
                      const option = options.find(
                        (o) =>
                          o.content === xArray[xIndex] &&
                          o.yContent === yArray[yIndex]
                      )

                      return (
                        <td
                          key={`x-radio-${xIndex + 1}`}
                          className={cn(
                            "h-12 w-12 border border-slate-400 text-center relative"
                          )}
                        >
                          {existsDimArray[yIndex][xIndex] ? (
                            <>
                              <label
                                className={cn(
                                  "w-full h-full flex items-center justify-center"
                                )}
                              >
                                <RadioGroupItem value={option?.id ?? ""} />
                              </label>
                              <button
                                type="button"
                                className="absolute top-0 right-0"
                              >
                                <Icon
                                  icon="mdi:delete-outline"
                                  className="text-red-500 cursor-pointer w-6 h-6 hover:text-red-400"
                                  onClick={
                                    () => handleDeleteOption(option?.id ?? "") // Will never be undefined
                                  }
                                />
                              </button>
                            </>
                          ) : (
                            <>
                              <span>X</span>
                              <button
                                type="button"
                                className="absolute top-0 right-0"
                              >
                                <Icon
                                  icon="mdi:add"
                                  className="text-slate-700 cursor-pointer w-6 h-6 hover:text-slate-500"
                                  onClick={() =>
                                    handleCreateOption(
                                      xArray[xIndex],
                                      yArray[yIndex]
                                    )
                                  }
                                />
                              </button>
                            </>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                </RadioGroup>
              ))}
            </tbody>
          </table>
          <Button
            variant="outline"
            className="mt-px"
            onClick={handleCreateColumn}
          >
            Add column
            <Icon icon="ep:bottom" className="ml-1" />
          </Button>
        </div>
        <Button variant="outline" className="mt-1" onClick={handleCreateRow}>
          Add row
          <Icon icon="ep:right" className="ml-1" />
        </Button>
      </div>
      <div className="flex flex-row gap-2 mt-4 items-center">
        <LoadingButton onClick={handleSave} isLoading={saveIsPending}>
          Save
        </LoadingButton>
        <Button variant="outline" onClick={handleRevert}>
          Revert
        </Button>
        <span className="text-sm">Remember to refresh the page on update</span>
      </div>
    </div>
  )
}
