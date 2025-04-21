import path from "node:path"
import fs from "node:fs"
import { program } from "commander"
import type { Question, QuestionOption } from "@/lib/db/types/question"
import { createKysely } from "../../src/lib/db"

const COURSES = {
  mfel1050: "Innføring i idrettsfysiologi",
  // mfel1010: "Innføring i medisin for ikke-medisinere",
} as const

program
  .name("update-chat-courses")
  .description("CLI to update courses")
  .action(async () => {
    const questions: Omit<Question, "id" | "createdAt" | "updatedAt">[] = []
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

        const data = JSON.parse(rawData)

        for (const questionData of data) {
          const content: string = questionData.content
          // file without extension
          const origin = file.split(".")[0]
          const options = questionData.options

          questions.push({
            courseId: course,
            label: null,
            content,
            origin,
            subContent: null,
            type: questionData.type ?? "MULTIPLE_CHOICE",
            imagePath: questionData.imagePath ?? null,
            imageWidth: questionData.imageWidth ?? null,
            imageHeight: questionData.imageHeight ?? null,
            draggableWidth: questionData.draggableWidth ?? null,
          })
          const questionOptions = options.map(
            (option: { answer: string; text: string; correct: boolean }) => ({
              questionId: "-1", // not yet found
              content: option.answer ?? option.text,
              correct: option.correct,
            })
          )
          optionsMap.set(`${content}-${origin}`, questionOptions)
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
      .returning(["id", "content", "origin"])
      .execute()

    const returnQuestionsMap = new Map(
      returns.map((q) => [`${q.content}-${q.origin}`, q.id])
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
