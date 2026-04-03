/**
 * Compute semantic similarity between questions using Azure OpenAI embeddings.
 *
 * Usage:
 *   npm run compute-similarities              # all courses
 *   npm run compute-similarities -- --course <courseId>  # single course
 *
 * Required env vars:
 *   DATABASE_URL
 *   AZURE_OPENAI_ENDPOINT
 *   AZURE_OPENAI_KEY
 *   AZURE_OPENAI_EMBEDDING_DEPLOYMENT   (default: "text-embedding-3-small")
 *   AZURE_OPENAI_API_VERSION
 */

import { program } from "commander"
import * as dotenv from "dotenv"
import { createKysely } from "../../src/lib/db"
import { computeSimilaritiesForCourse } from "../../src/lib/similarity"

dotenv.config({ path: ".env" })

async function main() {
  program
    .option("--course <courseId>", "Only process a specific course")
    .parse()
  const opts = program.opts<{ course?: string }>()

  const db = createKysely()

  let allQuestions = await db
    .selectFrom("question")
    .select(["id", "courseId", "content", "type", "origin"])
    .execute()

  if (opts.course) {
    allQuestions = allQuestions.filter((q) => q.courseId === opts.course)
    if (allQuestions.length === 0) {
      console.error(`No questions found for course "${opts.course}"`)
      process.exit(1)
    }
  }

  const byCourse = new Map<string, typeof allQuestions>()
  for (const q of allQuestions) {
    const list = byCourse.get(q.courseId) ?? []
    list.push(q)
    byCourse.set(q.courseId, list)
  }

  console.log(
    `Processing ${byCourse.size} course(s), ${allQuestions.length} total questions.`
  )

  for (const [courseId, questions] of byCourse) {
    process.stdout.write(`\nCourse ${courseId} — ${questions.length} questions ... `)
    const pairCount = await computeSimilaritiesForCourse(questions)
    console.log(`${pairCount ?? 0} similar pair(s) found`)
  }

  await db.destroy()
  console.log("\nDone!")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
