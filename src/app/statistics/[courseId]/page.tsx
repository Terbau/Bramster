"use client"

import { Breadcrumb } from "@/components/Breadcrumb"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { asReadbleTime } from "@/lib/utils"
import type { CourseDetailStats } from "@/types/game"
import { useQuery } from "@tanstack/react-query"
import { BookOpen, HelpCircle, Target } from "lucide-react"
import { useSession } from "next-auth/react"
import { useParams } from "next/navigation"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

function OverviewCards({ data }: { data: CourseDetailStats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Card>
        <CardHeader className="space-y-0.5 px-4 pt-4 sm:px-6 sm:pt-6">
          <CardDescription className="flex items-center gap-1 text-xs">
            <BookOpen className="h-3 w-3" /> Total sessions
          </CardDescription>
          <CardTitle className="text-3xl font-bold">
            {data.totalSessions}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="space-y-0.5 px-4 pt-4 sm:px-6 sm:pt-6">
          <CardDescription className="flex items-center gap-1 text-xs">
            <HelpCircle className="h-3 w-3" /> Questions answered
          </CardDescription>
          <CardTitle className="text-3xl font-bold">
            {data.totalQuestions}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="space-y-0.5 px-4 pt-4 sm:px-6 sm:pt-6">
          <CardDescription className="flex items-center gap-1 text-xs">
            <Target className="h-3 w-3" /> Overall accuracy
          </CardDescription>
          <CardTitle className="text-3xl font-bold">
            {data.overallAccuracy}%
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 pt-2">
          <Progress value={data.overallAccuracy} className="h-2" />
        </CardContent>
      </Card>
    </div>
  )
}

function AccuracyOverTimeChart({ data }: { data: CourseDetailStats }) {
  const chartData = data.sessions.map((s, i) => ({
    session: i + 1,
    accuracy: s.accuracy,
    date: asReadbleTime(new Date(s.finishedAt)),
    questions: s.totalQuestions,
    correct: s.totalCorrect,
    origin: s.origin,
  }))

  return (
    <Card>
      <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
        <CardTitle className="text-base sm:text-lg">Accuracy over time</CardTitle>
        <CardDescription className="text-xs">
          Accuracy per session in chronological order
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pb-4 sm:px-4 sm:pb-6">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="session"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              label={{ value: "Session #", position: "insideBottom", offset: -2, fontSize: 11 }}
              height={32}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
              width={40}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload
                return (
                  <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md space-y-1">
                    <p className="font-semibold">{d.date}</p>
                    <p className="text-muted-foreground">{d.origin}</p>
                    <p>
                      Accuracy:{" "}
                      <span className="font-medium">{d.accuracy}%</span>
                    </p>
                    <p className="text-muted-foreground">
                      {d.correct}/{d.questions} correct
                    </p>
                  </div>
                )
              }}
            />
            <Area
              type="monotone"
              dataKey="accuracy"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#accuracyGradient)"
              dot={{ r: 3, fill: "#6366f1", strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "#6366f1", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

function AccuracyByOriginChart({ data }: { data: CourseDetailStats }) {
  const chartData = data.originStats.map((o) => ({
    origin: o.origin,
    accuracy: o.accuracy,
    sessions: o.sessionCount,
    questions: o.totalQuestions,
    correct: o.totalCorrect,
  }))

  return (
    <Card>
      <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
        <CardTitle className="text-base sm:text-lg">Accuracy by exam set</CardTitle>
        <CardDescription className="text-xs">
          How well you perform on each origin / semester
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pb-4 sm:px-4 sm:pb-6">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="origin"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={chartData.length > 6 ? -30 : 0}
              textAnchor={chartData.length > 6 ? "end" : "middle"}
              height={chartData.length > 6 ? 52 : 32}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
              width={40}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload
                return (
                  <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md space-y-1">
                    <p className="font-semibold">{d.origin}</p>
                    <p>
                      Accuracy:{" "}
                      <span className="font-medium">{d.accuracy}%</span>
                    </p>
                    <p className="text-muted-foreground">
                      {d.correct}/{d.questions} correct
                    </p>
                    <p className="text-muted-foreground">
                      {d.sessions} {d.sessions === 1 ? "session" : "sessions"}
                    </p>
                  </div>
                )
              }}
            />
            <Bar
              dataKey="accuracy"
              fill="#6366f1"
              radius={[4, 4, 0, 0]}
              maxBarSize={56}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
      <Skeleton className="h-80 rounded-xl" />
      <Skeleton className="h-80 rounded-xl" />
    </div>
  )
}

export default function CourseStatisticsPage() {
  const { data: session } = useSession()
  const { courseId } = useParams<{ courseId: string }>()

  const { data, isLoading } = useQuery<CourseDetailStats>({
    queryKey: ["statistics", courseId],
    queryFn: () =>
      fetch(`/api/statistics/${courseId}`).then((res) => {
        if (!res.ok) throw new Error("Not found")
        return res.json()
      }),
    enabled: !!session,
  })

  return (
    <div>
      <Breadcrumb
        links={[
          { label: "Statistics", href: "/statistics" },
          {
            label: data ? `${courseId.toUpperCase()} — ${data.courseName}` : courseId.toUpperCase(),
            href: `/statistics/${courseId}`,
          },
        ]}
      />
      <h1 className="my-4 text-4xl font-bold">
        {courseId.toUpperCase()}
        {data && (
          <span className="ml-3 text-xl font-normal text-muted-foreground">
            {data.courseName}
          </span>
        )}
      </h1>

      {isLoading && <PageSkeleton />}
      {data && (
        <div className="space-y-6">
          <OverviewCards data={data} />
          {data.sessions.length > 1 && <AccuracyOverTimeChart data={data} />}
          {data.originStats.length > 0 && <AccuracyByOriginChart data={data} />}
        </div>
      )}
    </div>
  )
}
