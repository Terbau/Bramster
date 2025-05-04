"use client"

import {
  QuestionForm,
  type QuestionFormHandle,
  type QuestionFormData,
} from "@/components/DashboardForms/QuestionForm"
import {
  QuestionOptionForm,
  type QuestionOptionFormHandle,
  type QuestionOptionFormData,
} from "@/components/DashboardForms/QuestionOptionForm"
import { HorizontalScrollArea } from "@/components/HorizontalScrollArea/HorizontalScrollArea"
import { Button, LoadingButton } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useCreateBulkQuestions } from "@/hooks/useCreateBulkQuestions"
import { useGetCourses } from "@/hooks/useGetCourses"
import { useGetOrigins } from "@/hooks/useGetOrigins"
import {
  createPartialFromSchema,
  createStrictPartialOfRequiredFieldsFromSchema,
  isFieldRequired,
} from "@/lib/utils"
import {
  QuestionCreateSchema,
  QuestionOptionCreateSchema,
  type QuestionWithOptionsCreate,
  type Question,
  QuestionWithOptionsCreateSchema,
} from "@/types/question"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { z } from "zod"
import { isEqual } from "lodash"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  QuestionFromJsonForm,
  QuestionFromJsonSchema,
  type QuestionFromJsonFormData,
} from "@/components/DashboardForms/QuestionFromJsonForm"
import { InteractiveMultipleChoiceEditor } from "@/components/InteractiveEditors/InteractiveMultipleChoiceEditor"
import type { EditorQuestionOption } from "@/components/InteractiveEditors"

const QuestionOptionCreateWithTempIdSchema = QuestionOptionCreateSchema.extend({
  tempId: z.string(),
})

const QuestionWithOptionsCreateWithTempIdSchema =
  QuestionWithOptionsCreateSchema.omit({ options: true }).extend({
    tempId: z.string(),
    options: z.array(QuestionOptionCreateWithTempIdSchema),
  })

type QuestionWithOptionsCreateWithTempId = z.infer<
  typeof QuestionWithOptionsCreateWithTempIdSchema
>

export default function DashboardQuestionsCreateBulkPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()

  const questionRefs = useRef<(QuestionFormHandle | null)[]>([])
  const questionOptionRefs = useRef<(QuestionOptionFormHandle | null)[]>([])

  const [questionsData, setQuestionsData] = useState<
    QuestionWithOptionsCreateWithTempId[]
  >([])
  const [questionsTabValue, setQuestionsTabValue] = useState<string>("")
  const [optionsTabValue, setOptionsTabValue] = useState<string>(
    "interactivemultiplechoice"
  )

  const type = searchParams.get("type")
  const courseId = searchParams.get("courseId")
  const origin = searchParams.get("origin")
  const label = searchParams.get("label")

  const { mutate: mutateCreate, isPending: isPendingCreate } =
    useCreateBulkQuestions({
      onSuccess: (data) => {
        router.push("/dashboard/questions")
      },
    })

  const { data: coursesData, isLoading: coursesIsLoading } = useGetCourses({})

  const { data: originsData, isLoading: originsIsLoading } = useGetOrigins()

  const handleAddQuestion = (
    content?: string,
    defaultValues?: Partial<QuestionFormData>
  ): string => {
    const questionId = crypto.randomUUID()
    const newQuestion: QuestionWithOptionsCreateWithTempId = {
      tempId: questionId,
      content: content ?? "",
      type: (defaultValues?.type ?? type) as Question["type"],
      courseId: defaultValues?.courseId ?? courseId ?? "",
      origin: defaultValues?.origin ?? origin ?? "",
      label: defaultValues?.label ?? label ?? "",
      options: [],
    }
    setQuestionsData((prev) => [...prev, newQuestion])
    setQuestionsTabValue(newQuestion.tempId)

    return questionId
  }

  const handleAddOption = (
    questionId: string,
    content?: string,
    correct = false
  ) => {
    const newOption = {
      questionId, // Has to be edited with the real questionId
      tempId: crypto.randomUUID(),
      content: content ?? "",
      correct,
    }
    setQuestionsData((prev) =>
      prev.map((question) => {
        if (question.tempId === questionId) {
          return {
            ...question,
            options: [...question.options, newOption],
          }
        }
        return question
      })
    )
    setOptionsTabValue(newOption.tempId)
  }

  const handleQuestionChange = useCallback(
    (questionId: string, data: QuestionFormData) => {
      const question = questionsData.find((q) => q.tempId === questionId)
      if (!question) {
        throw new Error("Question not found")
      }

      const questionSubset = createPartialFromSchema(
        question,
        QuestionCreateSchema
      )

      // Check if the question data has changed, else it will throw a maxiumum depth error
      if (!isEqual(questionSubset, data)) {
        setQuestionsData((prev) =>
          prev.map((question) => {
            if (question.tempId === questionId) {
              return {
                ...question,
                ...data,
              }
            }
            return question
          })
        )
      }
    },
    [questionsData]
  )

  const handleOptionChange = useCallback(
    (questionId: string, optionId: string, data: QuestionOptionFormData) => {
      const question = questionsData.find((q) => q.tempId === questionId)
      if (!question) {
        throw new Error("Question not found")
      }
      const option = question.options.find((o) => o.tempId === optionId)
      if (!option) {
        throw new Error("Option not found")
      }

      const optionSubset = createPartialFromSchema(
        option,
        QuestionOptionCreateSchema
      )

      // Check if the question data has changed, else it will throw a maxiumum depth error
      if (!isEqual(optionSubset, data)) {
        setQuestionsData((prev) =>
          prev.map((question) => {
            if (question.tempId === questionId) {
              return {
                ...question,
                options: question.options.map((option) => {
                  if (option.tempId === optionId) {
                    return {
                      ...option,
                      ...data,
                    }
                  }
                  return option
                }),
              }
            }
            return question
          })
        )
      }
    },
    [questionsData]
  )

  const handleInteractiveSave = useCallback(
    (questionId: string, options: EditorQuestionOption[]) => {
      for (const option of options) {
        if (option.isNew) {
          handleAddOption(questionId, option.content, option.correct)
        } else {
          handleOptionChange(questionId, option.id, option)
        }
      }
    },
    [handleAddOption, handleOptionChange]
  )

  const handleCreate = () => {
    if (questionsData.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one question.",
        variant: "destructive",
      })
      return false
    }

    for (let i = 0; i < questionsData.length; i++) {
      const question = questionsData[i]

      if (question.options.length === 0) {
        toast({
          title: "Error",
          description: `Please add at least one option for question ${i + 1}.`,
          variant: "destructive",
        })
        return false
      }

      const keys = Object.keys(
        QuestionCreateSchema.shape
      ) as (keyof typeof QuestionCreateSchema.shape)[]

      for (const key of keys) {
        if (isFieldRequired(QuestionCreateSchema, key)) {
          if (!question || !question[key]) {
            toast({
              title: "Error",
              description: `Please fill in all required fields for question ${
                i + 1
              }.`,
              variant: "destructive",
            })
            return false
          }
        }
      }

      let hasAnyCorrect = false
      for (const option of question.options) {
        if (option.correct) {
          hasAnyCorrect = true
        }

        for (const key of Object.keys(
          QuestionOptionCreateSchema.shape
        ) as (keyof typeof QuestionOptionCreateSchema.shape)[]) {
          if (isFieldRequired(QuestionOptionCreateSchema, key)) {
            if (!option || !option[key]) {
              toast({
                title: "Error",
                description: `Please fill in all required fields for all options in question ${
                  i + 1
                }.`,
                variant: "destructive",
              })
              return false
            }
          }
        }
      }

      if (!hasAnyCorrect) {
        toast({
          title: "Error",
          description: `Please select at least one correct option for question ${
            i + 1
          }.`,
          variant: "destructive",
        })
        return false
      }
    }

    const questionsToCreate: QuestionWithOptionsCreate[] = questionsData.map(
      (question) => ({
        ...createStrictPartialOfRequiredFieldsFromSchema(
          question,
          QuestionCreateSchema
        ),
        options: question.options.map((option) =>
          createStrictPartialOfRequiredFieldsFromSchema(
            option,
            QuestionOptionCreateSchema
          )
        ),
      })
    )

    mutateCreate(questionsToCreate)
    // console.log("Create questions", questionsToCreate)
  }

  const handleFromJsonSubmit = (data: QuestionFromJsonFormData) => {
    const { jsonContents, ...defaultValues } = data

    const questionsData = QuestionFromJsonSchema.array().parse(
      JSON.parse(jsonContents)
    )

    for (const question of questionsData) {
      const questionId = handleAddQuestion(question.content, defaultValues)

      for (const option of question.options) {
        handleAddOption(questionId, option.content, option.correct)
      }
    }
  }

  useEffect(() => {
    if (questionsTabValue) {
      setOptionsTabValue("interactivemultiplechoice")
    }
  }, [questionsTabValue])

  return (
    <div className="mt-4">
      <Accordion className="mb-2" type="single" collapsible>
        <AccordionItem className="border-b-0" value="fromjson">
          <AccordionTrigger className="text-sm">
            Import from JSON
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-4">
                <QuestionFromJsonForm
                  coursesData={coursesData}
                  originsData={originsData}
                  submitButtonText="Import"
                  defaultValues={{
                    type: type as Question["type"],
                    courseId: courseId ?? "",
                    origin: origin ?? "",
                    label: label ?? "",
                  }}
                  onSubmit={handleFromJsonSubmit}
                />
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Tabs value={questionsTabValue} onValueChange={setQuestionsTabValue}>
        <HorizontalScrollArea className="w-full">
          <div className="flex flex-row gap-3 items-center">
            {questionsData.length > 0 && (
              <TabsList>
                {questionsData.map((question, index) => (
                  <TabsTrigger
                    key={`${question.tempId}-trigger`}
                    value={question.tempId}
                  >
                    Question {index + 1}
                  </TabsTrigger>
                ))}
              </TabsList>
            )}
            <Button variant="outline" onClick={() => handleAddQuestion()}>
              Add question
            </Button>
          </div>
        </HorizontalScrollArea>
        {questionsData.map((question, index) => (
          <TabsContent
            key={`${question.tempId}-content`}
            value={question.tempId}
          >
            <Card>
              <CardContent>
                <Tabs
                  value={optionsTabValue}
                  onValueChange={setOptionsTabValue}
                >
                  <HorizontalScrollArea className="w-full mt-4">
                    <div className="flex flex-row gap-3 items-center">
                      <TabsList>
                        <TabsTrigger value="question">Question</TabsTrigger>
                        {question.options.map((option, index) => (
                          <TabsTrigger
                            key={`${option.tempId}-option-trigger`}
                            value={option.tempId}
                          >
                            Option {index + 1}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      <Button
                        variant="outline"
                        onClick={() =>
                          setOptionsTabValue("interactivemultiplechoice")
                        }
                      >
                        Interactive editor
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleAddOption(question.tempId)}
                      >
                        Add option
                      </Button>
                    </div>
                  </HorizontalScrollArea>
                  <TabsContent value="question">
                    <QuestionForm
                      defaultValues={createPartialFromSchema(
                        question,
                        QuestionCreateSchema
                      )}
                      coursesData={coursesData}
                      originsData={originsData}
                      submitIsLoading={isPendingCreate}
                      ref={(el) => {
                        questionRefs.current[index] = el
                      }}
                      onChange={(data) =>
                        handleQuestionChange(question.tempId, data)
                      }
                    />
                  </TabsContent>
                  {question.options.map((option, optionIndex) => (
                    <TabsContent
                      key={`${option.tempId}-option`}
                      value={option.tempId}
                    >
                      <QuestionOptionForm
                        defaultValues={createPartialFromSchema(
                          option,
                          QuestionOptionCreateSchema
                        )}
                        submitIsLoading={isPendingCreate}
                        ref={(el) => {
                          questionOptionRefs.current[optionIndex] = el
                        }}
                        onChange={(data) =>
                          handleOptionChange(
                            question.tempId,
                            option.tempId,
                            data
                          )
                        }
                      />
                    </TabsContent>
                  ))}
                  {question.type === "MULTIPLE_CHOICE" && (
                    <TabsContent value="interactivemultiplechoice">
                      <InteractiveMultipleChoiceEditor
                        question={{
                          id: question.tempId,
                          createdAt: new Date(),
                          updatedAt: new Date(),
                          ...question,
                        }}
                        existingOptions={question.options.map((option) => ({
                          id: option.tempId,
                          createdAt: new Date(),
                          updatedAt: new Date(),
                          correct: false,
                          ...option,
                        }))}
                        onSave={(data) => {
                          handleInteractiveSave(question.tempId, data)
                          toast({
                            title: "Success",
                            description: "Question saved.",
                            variant: "default",
                          })
                        }}
                        onQuestionSave={(data) => {
                          handleQuestionChange(question.tempId, data)
                          toast({
                            title: "Success",
                            description: "Question options saved.",
                            variant: "default",
                          })
                        }}
                      />
                    </TabsContent>
                  )}
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
      <div className="flex flex-row gap-3 items-center border-t mt-4">
        <LoadingButton
          variant="outline"
          className="mt-4"
          onClick={handleCreate}
          disabled={questionsData.length === 0}
        >
          Create {questionsData.length} questions
        </LoadingButton>
      </div>
    </div>
  )
}
