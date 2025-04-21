import { getOrigins } from "@/lib/functions/course"
import type { OriginDetails } from "@/types/question"
import { NextResponse } from "next/server"

export async function GET(): Promise<NextResponse<OriginDetails[]>> {
  const origins = await getOrigins()

  return NextResponse.json(origins, { status: 200 })
}
