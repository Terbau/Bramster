"use client"

import {
  DashboardTable,
  type HeaderElement,
  type DashboardTableRow,
} from "@/components/DashboardTable/DashboardTable"
import { Pagination } from "@/components/Pagination"
import type { SortDirection } from "@/types/pagination"
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from "nuqs"
import { SortDirectionSchema } from "@/types/pagination"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { useDebouncedCallback } from "use-debounce"
import { Button } from "@/components/ui/button"
import { Icon } from "@iconify/react/dist/iconify.js"
import Link from "next/link"
import { useGetCourses } from "@/hooks/useGetCourses"

export default function DashboardCoursesPage() {
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(0))
  const [pageSize] = useQueryState("pageSize", parseAsInteger.withDefault(30))
  const [sortBy, setSortBy] = useQueryState(
    "sortBy",
    parseAsString.withDefault("createdAt")
  )
  const [sortDirection, setSortDirection] = useQueryState(
    "sortDirection",
    parseAsStringLiteral(SortDirectionSchema.options).withDefault("asc")
  )
  const [query, setQuery] = useQueryState(
    "query",
    parseAsString.withDefault("")
  )
  const [debouncedQuery, setDebouncedQuery] = useState(query)

  const debounced = useDebouncedCallback((value: string) => {
    setDebouncedQuery(value)
    setPage(0)
  }, 200)

  const { data, isLoading } = useGetCourses({
    page,
    pageSize,
    sortBy,
    sortDirection,
    query: debouncedQuery,
  })

  const totalPages = Math.ceil((data?.total ?? 0) / pageSize)

  const headerElems: HeaderElement[] = [
    { label: "#" },
    { label: "Id", sortKey: "id" },
    { label: "Name", sortKey: "name" },
    { label: "CreatedAt", sortKey: "createdAt" },
  ]

  const rows: DashboardTableRow[] =
    data?.results.map((c, index) => ({
      id: c.id,
      elements: [
        {
          label: (page * pageSize + index).toString(),
          href: `/dashboard/courses/${c.id}`,
        },
        {
          label: c.id,
          href: `/dashboard/courses/${c.id}`,
        },
        {
          label: c.name,
          breakAll: true,
        },
        {
          label: new Date(c.createdAt).toISOString(),
          noBreak: true,
        },
      ],
    })) ?? []

  const handleSortChange = (
    sortBy: string | undefined,
    sortDirection: SortDirection
  ) => {
    setSortBy(sortBy ?? "createdAt")
    setSortDirection(sortDirection)
  }

  return (
    <>
      <div className="flex flex-row gap-x-2 items-center ml-auto -mt-8 mb-4 w-fit">
        <Input
          placeholder="Search..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            debounced(e.target.value)
          }}
        />
        <Button variant="outline" className="flex flex-row gap-x-1" asChild>
          <Link href="/dashboard/courses/create">
            <Icon icon="mdi:plus" className="text-lg" />
            Add
          </Link>
        </Button>
      </div>
      <DashboardTable
        headerElems={headerElems}
        rows={rows}
        isLoading={isLoading}
        onSortChange={handleSortChange}
        sortBy={sortBy}
        sortDirection={sortDirection}
        page={page}
        pageSize={pageSize}
        totalAmount={data?.total ?? 0}
      />
      {totalPages > 1 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          onPageChange={(newPage) => setPage(newPage)}
          className="mt-4 sm:mt-8"
        />
      )}
    </>
  )
}
