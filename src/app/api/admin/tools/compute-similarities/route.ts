import { authOptions } from "@/lib/auth"
import { computeSimilaritiesForCourse } from "@/lib/similarity"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { NextResponse, type NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }
  if (!session.user.admin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (line: string) =>
        controller.enqueue(encoder.encode(line + "\n"))

      try {
        const allQuestions = await db
          .selectFrom("question")
          .select(["id", "courseId", "content", "type"])
          .execute()

        const byCourse = new Map<string, typeof allQuestions>()
        for (const q of allQuestions) {
          const list = byCourse.get(q.courseId) ?? []
          list.push(q)
          byCourse.set(q.courseId, list)
        }

        send(`Processing ${byCourse.size} course(s), ${allQuestions.length} total questions.`)

        for (const [courseId, questions] of byCourse) {
          send(`\nCourse ${courseId} — ${questions.length} questions...`)
          const pairCount = await computeSimilaritiesForCourse(questions)
          send(`  Found ${pairCount ?? 0} similar pair(s).`)
        }

        send("\nDone!")
      } catch (err) {
        send(`\nError: ${err instanceof Error ? err.message : String(err)}`)
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
