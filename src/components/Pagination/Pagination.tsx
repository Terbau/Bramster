import type { ComponentProps, FC } from "react"
import {
  Pagination as OriginalPagination,
  PaginationButton,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNextButton,
  PaginationPreviousButton,
} from "../ui/pagination"
import { cn } from "@/lib/utils"

interface PaginationProps extends ComponentProps<"nav"> {
  page: number
  pageSize: number
  totalPages: number
  amountShowOnLeft?: number
  amountShowOnRight?: number
  onPageChange?: (page: number) => void
}

export const Pagination: FC<PaginationProps> = ({
  page,
  pageSize,
  totalPages,
  amountShowOnLeft = 1,
  amountShowOnRight = 1,
  onPageChange,
  ...props
}) => {
  const pageNums = Array.from({ length: totalPages }, (_, i) => i).filter(
    (pageNum) =>
      pageNum <= page + amountShowOnRight &&
      pageNum >= page - amountShowOnLeft
  )
  const hasLeftEllipsis = pageNums[0] > 0
  const hasRightEllipsis = pageNums[pageNums.length - 1] < totalPages

  const paginationPreviousDisabled = page <= 0
  const paginationNextDisabled = page >= totalPages - 1

  return (
    <OriginalPagination {...props}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPreviousButton
            onClick={() => onPageChange?.(page - 1)}
            disabled={paginationPreviousDisabled}
            aria-disabled={paginationPreviousDisabled}
            tabIndex={paginationPreviousDisabled ? -1 : 0}
            className={cn({
              "text-gray-400 hover:text-gray-400 hover:border-none hover:bg-red":
                paginationPreviousDisabled,
            })}
          />
        </PaginationItem>
        {hasLeftEllipsis && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}
        {pageNums.map((pageNum) => (
          <PaginationItem key={pageNum}>
          <PaginationButton
            onClick={() => onPageChange?.(pageNum)}
            isActive={pageNum === page}
          >
            {pageNum + 1}
          </PaginationButton>
        </PaginationItem>
        ))}
        {hasRightEllipsis && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}

        <PaginationItem>
          <PaginationNextButton
            aria-disabled={paginationNextDisabled}
            disabled={paginationNextDisabled}
            onClick={() => onPageChange?.(page + 1)}
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
