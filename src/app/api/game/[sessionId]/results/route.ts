import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { NextResponse, type NextRequest } from "next/server"
import { getGameSessionWithResults } from "@/lib/functions/game"

export interface GameSessionParams {
  params: { sessionId: string }
}

export async function GET(request: NextRequest, { params }: GameSessionParams) {
  const gameSessionId = params.sessionId

  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const gameSessionWithResults = await getGameSessionWithResults(gameSessionId)
  if (!gameSessionWithResults) {
    return NextResponse.json(
      { message: "Game session not found" },
      { status: 404 }
    )
  }

  if (gameSessionWithResults.userId !== session.user.id) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json(gameSessionWithResults)
}
