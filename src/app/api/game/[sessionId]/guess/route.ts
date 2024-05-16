import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { NextResponse, type NextRequest } from "next/server"
import { addGuess, getGameSession, getGuess } from "@/lib/functions/game"
import type { GameSessionParams } from "../route"
import type { GuessCreate } from "@/types/game"

export async function POST(
  request: NextRequest,
  { params }: GameSessionParams
) {
  const gameSessionId = params.sessionId

  const body: Partial<GuessCreate> = await request.json()
  const { questionId, optionId } = body

  if (!questionId || !optionId) {
    return NextResponse.json(
      { message: "Question and option are required" },
      { status: 400 }
    )
  }

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

  const existingGuess = await getGuess(gameSessionId, questionId)

  if (existingGuess) {
    return NextResponse.json(
      { message: "Question is already answered" },
      { status: 400 }
    )
  }

  const guess = await addGuess({
    gameSessionId,
    questionId,
    optionId,
  })

  return NextResponse.json(guess)
}
