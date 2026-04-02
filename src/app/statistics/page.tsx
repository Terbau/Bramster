"use client"

import { Breadcrumb } from "@/components/Breadcrumb"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { asMoreReadableTime } from "@/lib/utils"
import type { CourseStats, UserStatistics } from "@/types/game"
import { useQuery } from "@tanstack/react-query"
import { BarChart2, BookOpen, HelpCircle, Target } from "lucide-react"
import { useSession } from "next-auth/react"
import Link from "next/link"

function OverviewCards({ data }: { data: UserStatistics }) {
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

function CourseStatCard({ course }: { course: CourseStats }) {
  return (
    <Link href={`/statistics/${course.courseId}`}>
      <Card className="hover:bg-gray-50 transition-colors">
        <CardHeader className="space-y-0.5 px-4 pt-4 sm:px-6 sm:pt-6">
          <CardTitle className="text-lg sm:text-2xl">
            {course.courseId.toUpperCase()}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {course.courseName}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-2 pt-3">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-muted-foreground text-xs">Accuracy</span>
            <span className="font-semibold text-sm">{course.accuracy}%</span>
          </div>
          <Progress value={course.accuracy} className="h-2" />
        </CardContent>
        <CardFooter className="px-4 pb-4 sm:px-6 sm:pb-6 text-xs text-muted-foreground flex flex-wrap gap-x-1.5">
          <span>{course.sessionCount} {course.sessionCount === 1 ? "session" : "sessions"}</span>
          <span>•</span>
          <span>{course.totalQuestions} questions</span>
          <span>•</span>
          <span>{asMoreReadableTime(new Date(course.lastAttempted))}</span>
        </CardFooter>
      </Card>
    </Link>
  )
}

function StatsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-36 rounded-xl" />
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
      <BarChart2 className="h-12 w-12 text-muted-foreground" />
      <h2 className="text-xl font-semibold">No sessions yet</h2>
      <p className="text-muted-foreground text-sm">
        Complete a quiz session to see your statistics here.
      </p>
    </div>
  )
}

export default function StatisticsPage() {
  const { data: session } = useSession()

  const { data, isLoading } = useQuery<UserStatistics>({
    queryKey: ["statistics"],
    queryFn: () => fetch("/api/statistics/me").then((res) => res.json()),
    enabled: !!session,
  })

  const isEmpty = data && data.courseStats.length === 0

  return (
    <div>
      <Breadcrumb links={[{ label: "Statistics", href: "/statistics" }]} />
      <h1 className="my-4 text-4xl font-bold">Statistics</h1>

      {isLoading && <StatsSkeleton />}
      {isEmpty && <EmptyState />}
      {data && !isEmpty && (
        <div className="space-y-6">
          <OverviewCards data={data} />
          <div>
            <h2 className="text-lg font-semibold mb-3">By course</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.courseStats.map((course) => (
                <CourseStatCard key={course.courseId} course={course} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
