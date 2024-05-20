"use client"

import { Breadcrumb } from "@/components/Breadcrumb"
import { Spinner } from "@/components/Spinner"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { asMoreReadableTime, cn } from "@/lib/utils"
import type { GameSession } from "@/types/game"
import type { Paginated } from "@/types/pagination"
import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

export default function MyResultsPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const page = Number(searchParams.get("page") ?? "0")
  const pageSize = Number(searchParams.get("pageSize") ?? "30")

  const { data, isLoading } = useQuery<Paginated<GameSession>>({
    queryKey: ["myResults", page, pageSize],
    queryFn: () =>
      fetch(`/api/game/results/me?page=${page}&pageSize=${pageSize}`).then(
        (res) => res.json()
      ),
    enabled: !!session,
  })

  const totalPages = Math.ceil((data?.total ?? 0) / pageSize)
  const currentPage = page
  const fixedPageComparison =
    totalPages > 2 && currentPage < 1 ? totalPages - 1 : totalPages

  const paginationPreviousDisabled = currentPage <= 0
  const paginationNextDisabled = currentPage >= totalPages - 1

  return (
    <div>
      <Breadcrumb links={[{ label: "My results", href: "/my-results" }]} />
      <h1 className="my-4 text-4xl font-bold">My results</h1>

      {isLoading && <Spinner />}
      {data && (
        <>
          <div className="grid auto-cols-fr sm:auto-cols-max sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data?.results.map((gameSession) => (
              <Link
                key={gameSession.id}
                href={`/game/${gameSession.id}/results`}
              >
                <Card className="hover:bg-gray-50">
                  <CardHeader className="space-y-0.5 px-4 pt-4 sm:px-6 sm:pt-6">
                    <CardTitle className="text-lg sm:text-2xl">
                      {gameSession.courseId.toUpperCase()}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      {gameSession.origin.toUpperCase()}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="px-4 pb-4 sm:px-6 sm:pb-6">
                    <div className="text-xs sm:text-sm">
                      <span className="">
                        {gameSession.amountQuestions} questions •{" "}
                        {asMoreReadableTime(
                          gameSession.finishedAt ?? new Date()
                        )}
                      </span>
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination className="mt-4 sm:mt-8">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href={`?page=${currentPage - 1}&pageSize=${pageSize}`}
                    aria-disabled={paginationPreviousDisabled}
                    tabIndex={paginationPreviousDisabled ? -1 : 0}
                    className={cn({
                      "text-gray-400 hover:text-gray-400 hover:border-none hover:bg-red":
                        paginationPreviousDisabled,
                    })}
                  />
                </PaginationItem>
                {currentPage > 1 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                {Array.from({
                  length:
                    currentPage > 0
                      ? Math.max(Math.min(fixedPageComparison, 3), 1)
                      : Math.max(Math.min(fixedPageComparison, 2), 1),
                }).map((_, index) => {
                  const actualIndex =
                    currentPage - (currentPage > 0 ? 1 : 0) + index

                  return (
                    <PaginationItem key={actualIndex}>
                      <PaginationLink
                        href={`?page=${actualIndex}&pageSize=${pageSize}`}
                        isActive={actualIndex === currentPage}
                      >
                        {actualIndex + 1}
                      </PaginationLink>
                    </PaginationItem>
                  )
                })}
                {currentPage < totalPages - 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}

                <PaginationItem>
                  <PaginationNext
                    href={`?page=${currentPage + 1}&pageSize=${pageSize}`}
                    aria-disabled={paginationNextDisabled}
                    tabIndex={paginationNextDisabled ? -1 : 0}
                    className={cn({
                      "text-gray-400 hover:text-gray-400 hover:border-none hover:bg-red":
                        paginationNextDisabled,
                    })}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  )
}
