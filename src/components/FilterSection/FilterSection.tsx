import { capitalized, cn } from "@/lib/utils"
import { useId, useState, type ComponentProps } from "react"
import { Badge } from "../ui/badge"
import { Label } from "../ui/label"
import { Icon } from "@iconify/react/dist/iconify.js"
import { Popover, PopoverContent } from "../ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command"
import { PopoverTrigger } from "@radix-ui/react-popover"

export interface Filter {
  label: string
  value: string
  type: string
}

interface FilterSectionProps extends ComponentProps<"div"> {
  filters: Filter[]
  availableFilters?: Filter[]
  label?: string
  onFilterRemove?: (filter: Filter) => void
  onFilterAdd?: (filter: Filter) => void
}

export const FilterSection = ({
  filters,
  availableFilters,
  label,
  onFilterRemove,
  onFilterAdd,
  className,
  children,
  ...props
}: FilterSectionProps) => {
  const id = useId()
  const [open, setOpen] = useState(false)

  const groupedFilters =
    availableFilters
      ?.filter(
        (filter) =>
          filters.find(
            (f) => filter.type === f.type && filter.value === f.value
          ) === undefined
      )
      ?.reduce(
        (acc, filter) => {
          const group = acc[filter.type] || []
          group.push(filter)
          acc[filter.type] = group
          return acc
        },
        {} as Record<string, Filter[]>
      ) ?? {}

  const handleFilterAdd = (value: string) => {
    const [group, filterValue] = value.split(";")
    const filter = availableFilters?.find(
      (f) => f.value === filterValue && f.type === group
    )
    if (filter) {
      onFilterAdd?.(filter)
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-2 p-3 border border-input rounded-sm",
        className
      )}
      {...props}
    >
      <div className="flex flex-row gap-2 items-center">
        {label && <Label className="mb-1">{label}</Label>}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger>
            <Badge
              variant="outline"
              className="flex flex-row gap-1 hover:bg-slate-100"
            >
              <Icon icon="mdi:plus" className="text-sm" />
            </Badge>
          </PopoverTrigger>
          <PopoverContent className="p-0" align="start">
            <Command>
              <CommandInput placeholder="Search..." className="h-9" />
              <CommandList>
                <CommandEmpty>Nothing found.</CommandEmpty>
                {Object.entries(groupedFilters).map(([group, innerFilters]) => (
                  <CommandGroup key={group} heading={capitalized(group)}>
                    {innerFilters.map((filter) => (
                      <CommandItem
                        key={`cmditem-${group}-${filter.label}`}
                        value={`${group};${filter.value}`}
                        onSelect={(currentValue) => {
                          handleFilterAdd(currentValue)
                          setOpen(false)
                        }}
                      >
                        {filter.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      {filters.length > 0 ? (
        <ul className="flex gap-2 flex-wrap">
          {filters.map((filter) => (
            <li key={`filterlabel-${filter.label}`}>
              <Badge variant="outline" className="flex flex-row gap-1">
                {filter.label}

                <button
                  type="button"
                  className=""
                  onClick={() => onFilterRemove?.(filter)}
                >
                  <Icon icon="mdi:close" className="text-sm" />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm">No filters active</p>
      )}
    </div>
  )
}
