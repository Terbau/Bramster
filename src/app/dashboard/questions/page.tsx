"use client"

import {
  DashboardTable,
  type HeaderElement,
  type DashboardTableRow,
} from "@/components/DashboardTable/DashboardTable"
import { Pagination } from "@/components/Pagination"
import type { SortDirection } from "@/types/pagination"
import { type QuestionType, QuestionTypeSchema } from "@/types/question"
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from "nuqs"
import { SortDirectionSchema } from "@/types/pagination"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { useDebouncedCallback } from "use-debounce"
import {
  type Filter,
  FilterSection,
} from "@/components/FilterSection/FilterSection"
import { Button } from "@/components/ui/button"
import { Icon } from "@iconify/react/dist/iconify.js"
import Link from "next/link"
import { useGetOrigins } from "@/hooks/useGetOrigins"
import { useGetQuestions } from "@/hooks/useGetQuestions"
import { useGetCourses } from "@/hooks/useGetCourses"

export default function DashboardQuestionsPage() {
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
  const [origins, setOrigins] = useQueryState(
    "origins",
    parseAsArrayOf(parseAsString).withDefault([])
  )
  const [types, setTypes] = useQueryState(
    "types",
    parseAsArrayOf(
      parseAsStringLiteral(QuestionTypeSchema.options)
    ).withDefault([])
  )
  const [courses, setCourses] = useQueryState(
    "courses",
    parseAsArrayOf(parseAsString).withDefault([])
  )
  const [debouncedQuery, setDebouncedQuery] = useState(query)

  const debounced = useDebouncedCallback((value: string) => {
    setDebouncedQuery(value)
    setPage(0)
  }, 200)

  const { data: originsData, isLoading: originsIsLoading } = useGetOrigins()

  const { data, isLoading } = useGetQuestions({
    page,
    pageSize,
    sortBy,
    sortDirection,
    query: debouncedQuery,
    origins,
    types,
    courseIds: courses,
  })

  const { data: coursesData, isLoading: coursesIsLoading } = useGetCourses({})

  const totalPages = Math.ceil((data?.total ?? 0) / pageSize)

  const headerElems: HeaderElement[] = [
    { label: "#" },
    { label: "Content", sortKey: "content" },
    { label: "CourseId", sortKey: "courseId" },
    { label: "Origin", sortKey: "origin" },
    { label: "Type", sortKey: "type" },
    { label: "CreatedAt", sortKey: "createdAt" },
  ]

  const rows: DashboardTableRow[] =
    data?.results.map((q, index) => ({
      id: q.id,
      elements: [
        {
          label: (page * pageSize + index).toString(),
          href: `/dashboard/questions/${q.id}`,
        },
        {
          label: q.content,
          breakAll: true,
        },
        {
          label: q.courseId,
          href: `/dashboard/courses/${q.courseId}`,
          isFiltered: courses.includes(q.courseId),
          onFilterToggle: () => {
            const filter: Filter = {
              label: q.courseId,
              value: q.courseId,
              type: "course",
            }
            if (courses.includes(q.courseId)) {
              handleFilterRemove(filter)
            } else {
              handleFilterAdd(filter)
            }
          },
        },
        {
          label: q.origin,
          noBreak: true,
          isFiltered: origins.includes(q.origin),
          onFilterToggle: () => {
            const filter: Filter = {
              label: q.origin,
              value: q.origin,
              type: "origin",
            }
            if (origins.includes(q.origin)) {
              handleFilterRemove(filter)
            } else {
              handleFilterAdd(filter)
            }
          },
          href: `/dashboard/questions/origins/${q.origin}`,
        },
        {
          label: q.type,
          noBreak: true,
          isFiltered: types.includes(q.type),
          onFilterToggle: () => {
            const filter: Filter = {
              label: q.type,
              value: q.type,
              type: "type",
            }
            if (types.includes(q.type)) {
              handleFilterRemove(filter)
            } else {
              handleFilterAdd(filter)
            }
          },
        },
        { label: new Date(q.createdAt).toISOString(), noBreak: true },
      ],
    })) ?? []

  const filters: Filter[] = [
    ...origins.map((origin) => ({
      label: origin,
      value: origin,
      type: "origin",
    })),
    ...types.map((type) => ({
      label: type,
      value: type,
      type: "type",
    })),
    ...courses.map((course) => ({
      label: course,
      value: course,
      type: "course",
    })),
  ]

  const availableFilters: Filter[] = [
    ...(coursesData?.results ?? []).map((course) => ({
      label: `${course.name} (${course.id})`,
      value: course.id,
      type: "course",
    })),
    ...QuestionTypeSchema.options.map((type) => ({
      label: type,
      value: type,
      type: "type",
    })),
    ...(originsData ?? []).map((origin) => ({
      label: origin.origin,
      value: origin.origin,
      type: "origin",
    })),
  ]

  const handleFilterRemove = (filter: Filter) => {
    switch (filter.type) {
      case "origin":
        setOrigins((prev) => prev.filter((o) => o !== filter.value))
        break
      case "type":
        setTypes((prev) => prev.filter((t) => t !== filter.value))
        break
      case "course":
        setCourses((prev) => prev.filter((c) => c !== filter.value))
        break
      default:
        break
    }
  }

  const handleFilterAdd = (filter: Filter) => {
    switch (filter.type) {
      case "origin":
        setOrigins((prev) => [...prev, filter.value])
        break
      case "type":
        setTypes((prev) => [...prev, filter.value as QuestionType])
        break
      case "course":
        setCourses((prev) => [...prev, filter.value])
        break
      default:
        break
    }
  }

  const handleSortChange = (
    sortBy: string | undefined,
    sortDirection: SortDirection
  ) => {
    setSortBy(sortBy ?? "createdAt")
    setSortDirection(sortDirection)
  }

  return (
    <>
      <div className="flex flex-row gap-x-2 items-center ml-auto -mt-8 w-fit">
        <Input
          placeholder="Search..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            debounced(e.target.value)
          }}
        />
        <Button variant="outline" className="flex flex-row gap-x-1" asChild>
          <Link href="/dashboard/questions/create">
            <Icon icon="mdi:plus" className="text-lg" />
            Add
          </Link>
        </Button>
        <Button variant="outline" className="flex flex-row gap-x-1" asChild>
          <Link href="/dashboard/questions/create/bulk">
            <Icon icon="mdi:plus" className="text-lg" />
            Add bulk
          </Link>
        </Button>
      </div>
      <FilterSection
        label="Filters"
        className="my-3"
        filters={filters}
        availableFilters={availableFilters}
        onFilterRemove={handleFilterRemove}
        onFilterAdd={handleFilterAdd}
      />
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
