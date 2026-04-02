import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { getGameStatsForUser } from "@/lib/functions/game"
import type { UserStatistics } from "@/types/game"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const rawStats = await getGameStatsForUser(session.user.id)

  const courseStats = rawStats
    .map((row) => ({
      ...row,
      lastAttempted: row.lastAttempted.toISOString(),
      accuracy:
        row.totalQuestions > 0
          ? Math.round((row.totalCorrect / row.totalQuestions) * 100)
          : 0,
    }))
    .sort((a, b) => b.sessionCount - a.sessionCount)

  const totalSessions = courseStats.reduce((s, c) => s + c.sessionCount, 0)
  const totalQuestions = courseStats.reduce((s, c) => s + c.totalQuestions, 0)
  const totalCorrect = courseStats.reduce((s, c) => s + c.totalCorrect, 0)
  const overallAccuracy =
    totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0

  const body: UserStatistics = {
    totalSessions,
    totalQuestions,
    totalCorrect,
    overallAccuracy,
    courseStats,
  }

  return NextResponse.json(body)
}
