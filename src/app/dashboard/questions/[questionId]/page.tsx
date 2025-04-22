"use client"

import { Spinner } from "@/components/Spinner"
import { useRouter } from "next/navigation"
import { QuestionForm } from "@/components/DashboardForms/QuestionForm"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QuestionOptionForm } from "@/components/DashboardForms/QuestionOptionForm"
import { useCallback, useEffect, useState } from "react"
import { useGetQuestion } from "@/hooks/useGetQuestion"
import { useGetQuestionOptions } from "@/hooks/useGetQuestionOptions"
import { useGetCourses } from "@/hooks/useGetCourses"
import { useGetOrigins } from "@/hooks/useGetOrigins"
import { useUpdateQuestion } from "@/hooks/useUpdateQuestion"
import { useDeleteQuestion } from "@/hooks/useDeleteQuestion"
import { useCreateQuestionOption } from "@/hooks/useCreateQuestionOption"
import { useUpdateQuestionOption } from "@/hooks/useUpdateQuestionOption"
import { useDeleteQuestionOption } from "@/hooks/useDeleteQuestionOption"

import { Button } from "@/components/ui/button"
import {
  QuestionOptionCreateSchema,
  type QuestionType,
  type QuestionOption,
} from "@/types/question"
import {
  type EditorQuestionOption,
  InteractiveImageDragAndDropEditor,
  InteractiveMatrixEditor,
} from "@/components/InteractiveEditors"
import { HorizontalScrollArea } from "@/components/HorizontalScrollArea/HorizontalScrollArea"
import { InteractiveMultipleChoiceEditor } from "@/components/InteractiveEditors/InteractiveMultipleChoiceEditor"
import { Icon } from "@iconify/react/dist/iconify.js"
import Link from "next/link"

export interface DashboardQuestionsDetailPageParams {
  params: { questionId: string }
}

const INTERACTIVE_EDITORS: Partial<Record<QuestionType, string>> = {
  MULTIPLE_CHOICE: "Interactive Multiple Choice Editor",
  MATRIX: "Interactive Matrix Editor",
  IMAGE_DRAG_AND_DROP: "Interactive Image Drag And Drop Editor",
} as const

export default function DashboardQuestionsDetailPage({
  params,
}: DashboardQuestionsDetailPageParams) {
  const router = useRouter()

  const [optionsTabValue, setOptionsTabValue] = useState<string | undefined>(
    undefined
  )

  const { data: questionData, isLoading: questionIsLoading } = useGetQuestion({
    questionId: params.questionId,
  })

  const isOptionId = useCallback(
    (id: string | undefined) => {
      const arr = ["new", undefined]

      if (
        questionData?.type &&
        Object.keys(INTERACTIVE_EDITORS).includes(questionData.type)
      ) {
        arr.push(INTERACTIVE_EDITORS[questionData.type])
      }

      return !arr.includes(id)
    },
    [questionData]
  )

  const {
    data: optionsData,
    isLoading: optionsIsLoading,
    refetch: optionsRefetch,
  } = useGetQuestionOptions({
    questionId: params.questionId,
  })
  const optionsMap = new Map(
    optionsData?.map((option) => [option.id, option]) ?? []
  )

  const { data: coursesData, isLoading: coursesIsLoading } = useGetCourses({})

  const { data: originsData, isLoading: originsIsLoading } = useGetOrigins()

  const { mutate: mutateUpdate, isPending: isPendingUpdate } =
    useUpdateQuestion({ questionId: params.questionId })

  const { mutate: mutateDelete, isPending: isPendingDelete } =
    useDeleteQuestion(
      { questionId: params.questionId },
      {
        onSuccess: () => {
          router.push("/dashboard/questions")
        },
      }
    )

  const { mutate: mutateCreateOption, isPending: isPendingCreateOption } =
    useCreateQuestionOption(
      {
        questionId: params.questionId,
      },
      {
        onSuccess: (data) => {
          setOptionsTabValue(data.id)
        },
      }
    )

  const { mutate: mutateUpdateOption, isPending: isPendingUpdateOption } =
    useUpdateQuestionOption({
      questionId: params.questionId,
      questionOptionId: isOptionId(optionsTabValue)
        ? optionsTabValue
        : undefined,
    })

  const { mutate: mutateDeleteOption, isPending: isPendingDeleteOption } =
    useDeleteQuestionOption({
      questionId: params.questionId,
      questionOptionId: isOptionId(optionsTabValue)
        ? optionsTabValue
        : undefined,
    })

  useEffect(() => {
    if (
      (optionsTabValue === undefined && optionsData) ||
      (isOptionId(optionsTabValue) &&
        optionsData &&
        !optionsData?.some((option) => option.id === optionsTabValue))
    ) {
      setOptionsTabValue(optionsData[0]?.id ?? "new")
    }
  }, [optionsData, optionsTabValue, isOptionId])

  const handleInteractiveSave = async (options: EditorQuestionOption[]) => {
    const updatedOptions = options
      .filter((option) => {
        if (option.isNew) {
          return false
        }

        const existingOption = optionsMap.get(option.id)

        if (!existingOption) {
          return false
        }

        return (
          option.xCoordinate !== existingOption.xCoordinate ||
          option.yCoordinate !== existingOption.yCoordinate ||
          option.content !== existingOption.content ||
          option.correct !== existingOption.correct ||
          option.yContent !== existingOption.yContent
        )
      })
      .map((option) => ({
        optionId: option.id,
        optionData: QuestionOptionCreateSchema.parse(option),
      }))

    const newOptions = options
      .filter((option) => option.isNew)
      .map((option) => QuestionOptionCreateSchema.parse(option))

    const removedOptions = optionsData
      ?.filter((option: QuestionOption) => {
        return !options.some((opt) => opt.id === option.id)
      })
      .map((option) => option.id)

    if (questionData) {
      await Promise.all([
        ...updatedOptions.map(({ optionId, optionData }) =>
          mutateUpdateOption({
            questionOptionId: optionId,
            data: optionData,
          })
        ),
        ...newOptions.map((option) => mutateCreateOption(option)),
        ...(removedOptions?.map((optionId) =>
          mutateDeleteOption({ questionOptionId: optionId })
        ) ?? []),
      ])

      // optionsRefetch()
    }

    return null
  }

  if (questionIsLoading) {
    return <Spinner />
  }

  if (!questionData) {
    return <div>Question not found</div>
  }

  return (
    <div className="flex flex-col gap-4 mt-4">
      <Tabs defaultValue="question">
        <div className="flex flex-row gap-2 items-center justify-between">
          <TabsList>
            <TabsTrigger value="question">Question</TabsTrigger>
            <TabsTrigger value="options">Options</TabsTrigger>
          </TabsList>
          <Button variant="outline" asChild>
            <Link
              href={`/dashboard/questions/create?courseId=${questionData.courseId}&origin=${questionData.origin}&type=${questionData.type}&label=${questionData.label}`}
            >
              <Icon icon="mdi:plus" className="mr-1" />
              Create similar question
            </Link>
          </Button>
        </div>
        <TabsContent value="question">
          <QuestionForm
            coursesData={coursesData}
            originsData={originsData}
            defaultValues={questionData}
            onSubmit={mutateUpdate}
            onDelete={mutateDelete}
            submitIsLoading={isPendingUpdate}
            deleteIsLoading={isPendingDelete}
            submitButtonText="Update"
          />
        </TabsContent>
        <TabsContent value="options">
          {optionsData && (
            <Tabs value={optionsTabValue} onValueChange={setOptionsTabValue}>
              <HorizontalScrollArea className="w-full">
                <div className="flex flex-row gap-2 items-center">
                  <TabsList>
                    {optionsData.map((option, index) => (
                      <TabsTrigger
                        key={`trigger-${option.id}`}
                        value={option.id}
                      >
                        Option {index + 1}
                      </TabsTrigger>
                    ))}
                    <TabsTrigger value="new">New Option</TabsTrigger>
                  </TabsList>

                  {Object.keys(INTERACTIVE_EDITORS).includes(
                    questionData.type
                  ) && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        setOptionsTabValue(
                          INTERACTIVE_EDITORS[questionData.type]
                        )
                      }
                    >
                      {INTERACTIVE_EDITORS[questionData.type]}
                    </Button>
                  )}
                </div>
              </HorizontalScrollArea>
              {optionsData.map((option) => (
                <TabsContent value={option.id} key={`content-${option.id}`}>
                  <QuestionOptionForm
                    defaultValues={option}
                    onSubmit={(data) => mutateUpdateOption({ data })}
                    onDelete={() => mutateDeleteOption({})}
                    submitIsLoading={isPendingUpdateOption}
                    deleteIsLoading={isPendingDeleteOption}
                    submitButtonText="Update"
                  />
                </TabsContent>
              ))}
              <TabsContent value="new">
                <QuestionOptionForm
                  defaultValues={{ questionId: questionData.id }}
                  onSubmit={mutateCreateOption}
                  submitIsLoading={isPendingCreateOption}
                  submitButtonText="Create"
                />
              </TabsContent>
              {INTERACTIVE_EDITORS.MULTIPLE_CHOICE && (
                <TabsContent value={INTERACTIVE_EDITORS.MULTIPLE_CHOICE}>
                  <InteractiveMultipleChoiceEditor
                    question={questionData}
                    existingOptions={optionsData}
                    saveIsPending={
                      isPendingUpdateOption ||
                      isPendingCreateOption ||
                      isPendingDeleteOption
                    }
                    onSave={handleInteractiveSave}
                    onQuestionSave={mutateUpdate}
                  />
                </TabsContent>
              )}
              {INTERACTIVE_EDITORS.MATRIX && (
                <TabsContent value={INTERACTIVE_EDITORS.MATRIX}>
                  <InteractiveMatrixEditor
                    questionId={questionData.id}
                    existingOptions={optionsData}
                    saveIsPending={
                      isPendingUpdateOption ||
                      isPendingCreateOption ||
                      isPendingDeleteOption
                    }
                    onSave={handleInteractiveSave}
                  />
                </TabsContent>
              )}
              {INTERACTIVE_EDITORS.IMAGE_DRAG_AND_DROP && (
                <TabsContent value={INTERACTIVE_EDITORS.IMAGE_DRAG_AND_DROP}>
                  <InteractiveImageDragAndDropEditor
                    questionId={questionData.id}
                    imagePath={questionData.imagePath ?? ""}
                    imageHeight={questionData.imageHeight}
                    imageWidth={questionData.imageWidth}
                    draggableWidth={questionData.draggableWidth}
                    existingOptions={optionsData}
                    saveIsPending={
                      isPendingUpdateOption ||
                      isPendingCreateOption ||
                      isPendingDeleteOption
                    }
                    onSave={handleInteractiveSave}
                  />
                </TabsContent>
              )}
            </Tabs>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
