"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Loader2, Play } from "lucide-react"
import { useCallback, useRef, useState } from "react"

type RunState = "idle" | "running" | "done" | "error"

function ComputeSimilaritiesCard() {
  const [state, setState] = useState<RunState>("idle")
  const [logs, setLogs] = useState<string>("")
  const logRef = useRef<HTMLPreElement>(null)

  const handleRun = useCallback(async () => {
    setState("running")
    setLogs("")

    try {
      const response = await fetch("/api/admin/tools/compute-similarities", {
        method: "POST",
      })

      if (!response.ok || !response.body) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setLogs((prev) => {
          const next = prev + chunk
          requestAnimationFrame(() => {
            if (logRef.current) {
              logRef.current.scrollTop = logRef.current.scrollHeight
            }
          })
          return next
        })
      }

      setState("done")
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setLogs((prev) => `${prev}\nError: ${msg}`)
      setState("error")
    }
  }, [])

  return (
    <Card>
      <CardHeader className="px-4 pt-4 pb-4 sm:px-6 sm:pt-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">Compute similarities</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Embeds all questions using Azure OpenAI and computes semantic
              similarity pairs across each course. Run this after bulk-importing
              questions.
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={handleRun}
            disabled={state === "running"}
            variant={state === "error" ? "destructive" : "default"}
            className="shrink-0"
          >
            {state === "running" ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5 mr-1.5" />
            )}
            {state === "idle"
              ? "Run"
              : state === "running"
              ? "Running…"
              : state === "done"
              ? "Run again"
              : "Retry"}
          </Button>
        </div>
      </CardHeader>
      {logs.length > 0 && (
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          <pre
            ref={logRef}
            className="bg-muted rounded-md p-3 text-xs font-mono whitespace-pre-wrap break-words max-h-72 overflow-y-auto"
          >
            {logs}
          </pre>
        </CardContent>
      )}
    </Card>
  )
}

export default function ToolsPage() {
  return (
    <div className="space-y-4 mt-4">
      <ComputeSimilaritiesCard />
    </div>
  )
}
