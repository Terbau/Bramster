import type { Question, QuestionOption } from "@/types/question"
import { useEffect, useState } from "react"
import { Button, LoadingButton } from "../ui/button"
import type { EditorQuestionOption } from "."
import { useToast } from "../ui/use-toast"
import { Input } from "../ui/input"
import { Icon } from "@iconify/react/dist/iconify.js"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "../ui/table"
import { Checkbox } from "../ui/checkbox"

interface InteractiveSentenceSelectEditorProps {
  question: Question
  existingOptions?: QuestionOption[]
  saveIsPending?: boolean
  onSave?: (options: EditorQuestionOption[]) => void
  onQuestionSave?: (questionData: Question) => void
}

export const InteractiveSentenceSelectEditor = ({
  question: existingQuestion,
  existingOptions = [],
  saveIsPending = false,
  onSave,
  onQuestionSave,
}: InteractiveSentenceSelectEditorProps) => {
  const { toast } = useToast()

  const [question, setQuestion] = useState<Question>(existingQuestion)
  const [options, setOptions] = useState<EditorQuestionOption[]>(
    existingOptions.map((option) => ({
      ...option,
      isNew: false,
    }))
  )

  useEffect(() => {
    setQuestion(existingQuestion)
  }, [existingQuestion])

  useEffect(() => {
    setOptions(
      existingOptions.map((option) => ({
        ...option,
        isNew: false,
      }))
    )
  }, [existingOptions])

  const handleCreateOption = (xContent: string, yContent: string) => {
    const newOption: EditorQuestionOption = {
      id: crypto.randomUUID(), // Will be replaced with a real ID from the server when actually created
      content: xContent,
      yContent: yContent,
      isNew: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      questionId: existingQuestion.id,
      correct: false,
    }
    setOptions((prev) => [...prev, newOption])
  }

  const handleDeleteOption = (optionId: QuestionOption["id"]) => {
    setOptions((prev) => prev.filter((opt) => opt.id !== optionId))
  }

  const handleSave = () => {
    if (!question.content) {
      toast({
        title: "Error",
        description: "Please fill the question content before saving.",
        variant: "destructive",
      })
      return
    }

    if (!question.subContent) {
      toast({
        title: "Error",
        description: "Please fill the question subcontent before saving.",
        variant: "destructive",
      })
      return
    }

    if (options.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one option before saving.",
        variant: "destructive",
      })
    }

    if (options.some((opt) => opt.content === "")) {
      toast({
        title: "Error",
        description: "Please fill all the column names before saving.",
        variant: "destructive",
      })
      return
    }

    if (!options.some((opt) => opt.correct)) {
      toast({
        title: "Error",
        description: "Please select at least one correct option.",
        variant: "destructive",
      })
      return
    }

    onSave?.(options)
    onQuestionSave?.(question)
  }

  const handleRevert = () => {
    setOptions(
      existingOptions.map((option) => ({
        ...option,
        isNew: false,
      }))
    )
  }

  const handleQuestionSubContentChange = (value: string) => {
    setQuestion((prev) => ({
      ...prev,
      subContent: value,
    }))
  }

  const handleOptionContentChange = (
    optionId: QuestionOption["id"],
    value: string
  ) => {
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

  const handleCheckedChange = (
    optionId: QuestionOption["id"],
    checked: boolean
  ) => {
    setOptions((prev) => {
      const newOptions = prev.map((opt) => {
        if (opt.id === optionId) {
          return {
            ...opt,
            correct: checked,
          }
        }
        return opt
      })
      return newOptions
    })
  }

  const handleCreateOptionsFromClipboard = async () => {
    const clipboardText = await navigator.clipboard.readText()

    if (!clipboardText) {
      toast({
        title: "Error",
        description: "Clipboard is empty.",
        variant: "destructive",
      })
      return
    }

    // Should be like this:
    // "Vanskelig (Muskehypertrofi, Hormonutløst hyperplasi, Hormonatrofi, Muskelatrofi)er for
    // eksempel vekst av kvinnebryst ved pubertet og amming."
    //
    // The result then ends up like this:
    // parts = ["Muskehypertrofi", "Hormonutløst hyperplasi", "Hormonatrofi", "Muskelatrofi"]
    // subContent = "Vanskelig {{placeholder}} er for eksempel vekst av kvinnebryst ved pubertet og amming."

    const regex = /(?<firstPart>.+)?\((?<parens>.*)\)(?<lastPart>.*)?/
    const match = clipboardText.replace(/[\r\n]+/g, " ").match(regex)
    if (!match) {
      toast({
        title: "Error",
        description: "Clipboard text is not in the correct format.",
        variant: "destructive",
      })
      return
    }
    const matches = match.groups as {
      firstPart: string | undefined
      parens: string
      lastPart: string | undefined
    }
    const parts = matches.parens.split(",").map((part) => part.trim())
    const firstPartTrimmed = matches.firstPart?.trim()
    const lastPartTrimmed = matches.lastPart?.trim()

    const stringParts = [
      firstPartTrimmed ? `${firstPartTrimmed} ` : "",
      "{{placeholder}}",
      lastPartTrimmed ? ` ${lastPartTrimmed}` : "",
    ]

    const newOptions = parts.map((part) => ({
      id: crypto.randomUUID(),
      content: part,
      correct: false,
      isNew: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      questionId: existingQuestion.id,
    }))
    setOptions((prev) => [...prev, ...newOptions])
    setQuestion((prev) => ({
      ...prev,
      subContent: stringParts.join(""),
    }))
  }

  return (
    <div className="border-t border-input pt-4 ">
      <div className="border border-input shadow-md p-4 rounded-sm w-full">
        <h2 className="text-lg font-semibold mb-2">Sub Content</h2>
        <Input
          value={question.subContent ?? ""}
          onChange={(e) => handleQuestionSubContentChange(e.target.value)}
        />

        <h2 className="text-lg mt-4 font-semibold mb-2">Options</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">Correct</TableHead>
              <TableHead>Content</TableHead>
              <TableHead className="text-center">Delete</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {options.map((option) => (
              <TableRow key={`interactive-multiple-choice-input-${option.id}`}>
                <td className="w-1/12 text-center">
                  <Checkbox
                    id={`interactive-multiple-choice-input-${option.id}`}
                    checked={option.correct}
                    onCheckedChange={(checked) =>
                      handleCheckedChange(
                        option.id,
                        typeof checked === "boolean" ? checked : false
                      )
                    }
                  />
                </td>
                <td className="w-10/12 py-2 text-center">
                  <Input
                    value={option.content}
                    onChange={(e) =>
                      handleOptionContentChange(option.id, e.target.value)
                    }
                  />
                </td>
                <td className="w-1/12 text-center">
                  <button
                    type="button"
                    onClick={() => handleDeleteOption(option.id)}
                  >
                    <Icon
                      icon="mdi:delete"
                      className="text-red-500 h-6 w-6 hover:text-red-700"
                    />
                    <span className="sr-only">Delete</span>
                  </button>
                </td>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex flex-row gap-2 mt-2 items-center">
          <Button variant="outline" onClick={() => handleCreateOption("", "")}>
            <Icon icon="mdi:add" className="mr-1" />
            Add Option
          </Button>
          <Button variant="outline" onClick={handleCreateOptionsFromClipboard}>
            <Icon icon="mdi:auto-fix" className="mr-1" />
            Create from clipboard
          </Button>
        </div>
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
