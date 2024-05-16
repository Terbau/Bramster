import path from "node:path"
import fs from "node:fs"
import { program } from "commander"
import type { Question, QuestionOption } from "@/lib/db/types/question"
import { createKysely } from "../../src/lib/db"

const COURSES = {
  mfel1050: "Innføring i idrettsfysiologi",
  mfel1010: "Innføring i medisin for ikke-medisinere",
} as const

program
  .name("update-courses")
  .description("CLI to update courses")
  .action(async () => {
    const questions: Omit<Question, "id" | "createdAt" | "updatedAt">[] =
      []
    const optionsMap: Map<
      string,
      Omit<QuestionOption, "id" | "createdAt" | "updatedAt">[]
    > = new Map()

    for (const course of Object.keys(COURSES)) {
      const courseFolder = path.join(__dirname, `./courses/${course}`)
      const files = fs.readdirSync(courseFolder)
      for (const file of files) {
        const filePath = path.join(courseFolder, file)
        const rawData = fs.readFileSync(filePath, "utf8")

        const rawDataSplit = rawData.split(/^(?:\d+\n)|(?:(?<=\])\d+\n)/)

        for (const rawPart of rawDataSplit) {
          if (
            !rawPart ||
            (!rawPart.startsWith("[") && !rawPart.startsWith("{"))
          ) {
            continue
          }

          const part = JSON.parse(rawPart)

          // Now to the actual logic of finding the questions
          for (const outerArr of part) {
            const outerObj = outerArr[1]
            if (!outerObj) {
              continue
            }

            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            const obj = outerObj[0] as any

            const fields = obj?.documentChange?.document?.fields

            const question = fields?.question?.stringValue
            const exam = fields?.exam?.stringValue
            const options = fields?.options?.arrayValue?.values
            const correctOptions = fields?.answers?.arrayValue?.values.map(
              (option: { integerValue: string }) =>
                Number.parseInt(option.integerValue)
            )

            if (!question || !exam || !options) {
              continue
            }

            questions.push({
              courseId: course,
              question,
              origin: exam,
            })
            const questionOptions = options.map(
              (option: { stringValue: string }, index: number) => ({
                questionId: "-1", // not yet found
                option: option.stringValue,
                correct: correctOptions.includes(index),
              })
            )
            optionsMap.set(`${question}-${exam}`, questionOptions)
          }
        }
      }
    }

    const db = createKysely()

    await db
      .insertInto("course")
      .values(Object.entries(COURSES).map(([id, name]) => ({ id, name })))
      .onConflict((oc) =>
        oc.column("id").doUpdateSet({
          name: (eb) => eb.ref("excluded.name"),
        })
      )
      .execute()

    const returns = await db
      .insertInto("question")
      .values(questions)
      .returning(["id", "question", "origin"])
      .execute()

    const returnQuestionsMap = new Map(
      returns.map((q) => [`${q.question}-${q.origin}`, q.id])
    )

    const options = Array.from(optionsMap.entries()).flatMap(
      ([questionWithExam, option]) => {
        const questionId = returnQuestionsMap.get(questionWithExam) as string
        return option.map((opt) => ({ ...opt, questionId }))
      }
    )

    await db.insertInto("questionOption").values(options).execute()

    console.log("Done!")
  })

program.parse()
