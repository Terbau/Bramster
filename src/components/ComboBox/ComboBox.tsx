import { type ComponentProps, forwardRef, useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Button } from "../ui/button"
import { Check, ChevronsUpDown } from "lucide-react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command"
import { cn } from "@/lib/utils"

export interface ComboBoxItem {
  label: string
  value: string
}

interface ComboBoxProps extends ComponentProps<typeof Popover> {
  items: ComboBoxItem[]
  value?: string
  defaultOpen?: boolean
  onValueChange?: (value: string) => void
}

export const ComboBox = forwardRef<HTMLButtonElement, ComboBoxProps>(
  ({ items, defaultOpen = false, value, onValueChange }, ref) => {
    const [open, setOpen] = useState(defaultOpen)

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            {value
              ? items.find((item) => item.value === value)?.label
              : "Select..."}
            <ChevronsUpDown className="ml-auto opacity-50 h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" align="start">
          <Command>
            <CommandInput placeholder="Search..." className="h-9" />
            <CommandList>
              <CommandEmpty>Nothing found.</CommandEmpty>
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.value}
                    value={item.value}
                    onSelect={(currentValue) => {
                      onValueChange?.(
                        currentValue === value ? "" : currentValue
                      )
                      setOpen(false)
                    }}
                  >
                    {item.label}
                    <Check
                      className={cn(
                        "ml-auto",
                        value === item.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }
)

ComboBox.displayName = "ComboBox"
