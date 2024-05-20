import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { NextResponse, type NextRequest } from "next/server"
import {
  getGameSessionsForUser,
  getTotalGameSessionsForUser,
} from "@/lib/functions/game"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = Number(searchParams.get("page") ?? "0")
  const pageSize = Number(searchParams.get("pageSize") ?? "30")

  const [gameSessions, totalGameSessions] = await Promise.all([
    getGameSessionsForUser(session.user.id, page, pageSize),
    getTotalGameSessionsForUser(session.user.id),
  ])

  return NextResponse.json({
    total: totalGameSessions,
    results: gameSessions,
  })
}
