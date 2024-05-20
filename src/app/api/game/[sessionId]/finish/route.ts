import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { NextResponse, type NextRequest } from "next/server"
import { getGameSession, updateGameSession } from "@/lib/functions/game"
import type { GameSessionParams } from "../route"

export async function POST(
  request: NextRequest,
  { params }: GameSessionParams
) {
  const gameSessionId = params.sessionId

  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const gameSession = await getGameSession(gameSessionId)
  if (!gameSession) {
    return NextResponse.json(
      { message: "Game session not found" },
      { status: 404 }
    )
  }

  if (gameSession.userId !== session.user.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  if (gameSession.finishedAt) {
    return NextResponse.json(
      { message: "Game session is already finished" },
      { status: 400 }
    )
  }

  if (gameSession.amountQuestions > 0 && gameSession.amountQuestions !== gameSession.guessAmount) {
    return NextResponse.json(
      { message: "Game session is not completed" },
      { status: 400 }
    )
  }

  const updatedGameSession = await updateGameSession(gameSessionId, {
    finishedAt: new Date(),
  })

  return NextResponse.json(updatedGameSession)
}
