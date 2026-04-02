import { authOptions } from "@/lib/auth"
import { getCourseSessionStatsForUser } from "@/lib/functions/game"
import { compareOrigins } from "@/lib/utils"
import type { CourseDetailStats, CourseOriginStat } from "@/types/game"
import { getServerSession } from "next-auth"
import { NextResponse, type NextRequest } from "next/server"

export async function GET(
  _request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const { courseId } = params
  const { courseName, sessions: rawSessions } = await getCourseSessionStatsForUser(
    session.user.id,
    courseId
  )

  if (rawSessions.length === 0) {
    return NextResponse.json({ message: "Not found" }, { status: 404 })
  }

  const sessions = rawSessions.map((s) => ({
    sessionId: s.sessionId,
    finishedAt: s.finishedAt.toISOString(),
    origin: s.origin,
    totalQuestions: s.totalQuestions,
    totalCorrect: s.totalCorrect,
    accuracy:
      s.totalQuestions > 0
        ? Math.round((s.totalCorrect / s.totalQuestions) * 100)
        : 0,
  }))

  // Aggregate per origin
  const originMap = new Map<string, CourseOriginStat>()
  for (const s of rawSessions) {
    const existing = originMap.get(s.origin)
    if (!existing) {
      originMap.set(s.origin, {
        origin: s.origin,
        sessionCount: 1,
        totalQuestions: s.totalQuestions,
        totalCorrect: s.totalCorrect,
        accuracy: 0,
      })
    } else {
      existing.sessionCount++
      existing.totalQuestions += s.totalQuestions
      existing.totalCorrect += s.totalCorrect
    }
  }

  const originStats = Array.from(originMap.values())
    .map((o) => ({
      ...o,
      accuracy:
        o.totalQuestions > 0
          ? Math.round((o.totalCorrect / o.totalQuestions) * 100)
          : 0,
    }))
    .sort((a, b) => compareOrigins(a.origin, b.origin))

  const totalQuestions = rawSessions.reduce((s, r) => s + r.totalQuestions, 0)
  const totalCorrect = rawSessions.reduce((s, r) => s + r.totalCorrect, 0)

  const body: CourseDetailStats = {
    courseId,
    courseName,
    totalSessions: rawSessions.length,
    totalQuestions,
    totalCorrect,
    overallAccuracy:
      totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
    sessions,
    originStats,
  }

  return NextResponse.json(body)
}
