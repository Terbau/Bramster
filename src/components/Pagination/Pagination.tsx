import type { FC } from "react"
import {
  Pagination as OriginalPagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination"
import { cn } from "@/lib/utils"

interface PaginationProps {
  page: number
  pageSize: number
  totalPages: number
  className?: string
}

export const Pagination: FC<PaginationProps> = ({
  page,
  pageSize,
  totalPages,
  className,
}) => {
  const fixedPageComparison =
    totalPages > 2 && page < 1 ? totalPages - 1 : totalPages

  const paginationPreviousDisabled = page <= 0
  const paginationNextDisabled = page >= totalPages - 1

  return (
    <OriginalPagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={`?page=${page - 1}&pageSize=${pageSize}`}
            aria-disabled={paginationPreviousDisabled}
            tabIndex={paginationPreviousDisabled ? -1 : 0}
            className={cn({
              "text-gray-400 hover:text-gray-400 hover:border-none hover:bg-red":
                paginationPreviousDisabled,
            })}
          />
        </PaginationItem>
        {page > 1 && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}
        {Array.from({
          length:
            page > 0
              ? Math.max(Math.min(fixedPageComparison, 3), 1)
              : Math.max(Math.min(fixedPageComparison, 2), 1),
        }).map((_, index) => {
          const actualIndex = page - (page > 0 ? 1 : 0) + index

          return (
            <PaginationItem key={actualIndex}>
              <PaginationLink
                href={`?page=${actualIndex}&pageSize=${pageSize}`}
                isActive={actualIndex === page}
              >
                {actualIndex + 1}
              </PaginationLink>
            </PaginationItem>
          )
        })}
        {page < totalPages - 2 && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}

        <PaginationItem>
          <PaginationNext
            href={`?page=${page + 1}&pageSize=${pageSize}`}
            aria-disabled={paginationNextDisabled}
            tabIndex={paginationNextDisabled ? -1 : 0}
            className={cn({
              "text-gray-400 hover:text-gray-400 hover:border-none hover:bg-red":
                paginationNextDisabled,
            })}
          />
        </PaginationItem>
      </PaginationContent>
    </OriginalPagination>
  )
}
