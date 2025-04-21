import Link from "next/link"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table"
import { Spinner } from "../Spinner"
import { cn } from "@/lib/utils"
import type { SortDirection } from "@/types/pagination"
import { Badge } from "../ui/badge"
import { Icon } from "@iconify/react/dist/iconify.js"

export interface DashboardTableRowElementDetails {
  label: string
  href?: string
  isFiltered?: boolean
  onFilterToggle?: () => void
  noBreak?: boolean
  breakAll?: boolean
  noClamp?: boolean
}

export type DashboardTableRowElement = string | DashboardTableRowElementDetails

export interface DashboardTableRow {
  id: string
  elements: DashboardTableRowElement[]
}

export interface HeaderElement {
  label: string
  sortKey?: string
}

interface DashboardTableProps {
  headerElems: HeaderElement[]
  rows: DashboardTableRow[] | undefined
  isLoading?: boolean
  sortBy?: undefined | string
  sortDirection?: SortDirection
  page?: number
  pageSize?: number
  totalAmount?: number
  onSortChange?: (
    sortBy: string | undefined,
    sortDirection: SortDirection
  ) => void
}

export const DashboardTable = ({
  headerElems,
  rows,
  isLoading = false,
  sortBy = undefined,
  sortDirection = "asc",
  page = 0,
  pageSize = 30,
  totalAmount = 0,
  onSortChange,
}: DashboardTableProps) => {
  const handleSortChange = (headerElem: string) => {
    if (!onSortChange) return

    if (sortBy === headerElem) {
      switch (sortDirection) {
        case "asc":
          onSortChange(headerElem, "desc")
          return
        case "desc":
          onSortChange(undefined, "asc") // Reset sort
          return
        default:
          onSortChange(headerElem, "asc")
          return
      }
    }

    onSortChange(headerElem, "asc")
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {headerElems.map((headerElem) => (
            <TableHead key={headerElem.label}>
              <button
                type="button"
                className="flex flex-row gap-x-1"
                disabled={!headerElem.sortKey}
                onClick={() => handleSortChange(headerElem.sortKey ?? "")}
              >
                {headerElem.label}
                {sortBy === headerElem.sortKey && (
                  <span>
                    {sortDirection === "asc" ? <span>↑</span> : <span>↓</span>}
                  </span>
                )}
              </button>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      {isLoading ? (
        <TableBody>
          <TableRow>
            <TableCell colSpan={headerElems.length}>
              {/* Must be placed inside a cell in order for React not to scream hydration issues */}
              <Spinner className="my-4" />
            </TableCell>
          </TableRow>
        </TableBody>
      ) : (
        <TableBody>
          {rows?.map((row) => (
            <TableRow key={row.id}>
              {row.elements.map((element, index) => {
                const elem: DashboardTableRowElementDetails =
                  typeof element === "object" ? element : { label: element }

                return (
                  <TableCell
                    key={`${row.id}-${index}`}
                    className={cn(
                      "relative group",
                      {
                        "whitespace-nowrap": elem.noBreak,
                      },
                      {
                        "break-all": elem.breakAll,
                      }
                    )}
                  >
                    <>
                      {elem.href ? (
                        <Link href={elem.href} className="text-blue-500">
                          {elem.label}
                        </Link>
                      ) : elem.breakAll && !elem.noClamp ? (
                        <span className="line-clamp-6">{elem.label}</span>
                      ) : (
                        elem.label
                      )}
                      {elem.onFilterToggle && (
                        <button
                          type="button"
                          onClick={elem.onFilterToggle}
                          className="hidden absolute -right-1 -top-2 group-hover:block group-focus-within:block"
                        >
                          <Badge className="flex flex-row gap-1">
                            Filter
                            {elem.isFiltered ? (
                              <Icon
                                icon="material-symbols:close"
                                className="text-xs"
                              />
                            ) : (
                              <Icon
                                icon="material-symbols:add"
                                className="text-xs"
                              />
                            )}
                          </Badge>
                        </button>
                      )}
                    </>
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      )}
      {pageSize > 0 && (
        <TableCaption>
          {`Displaying ${
            totalAmount > 1
              ? `${Math.min(page * pageSize + 1, totalAmount)}-${Math.min(
                  (page + 1) * pageSize,
                  totalAmount
                )} of`
              : ""
          } ${totalAmount} results`}
        </TableCaption>
      )}
    </Table>
  )
}
