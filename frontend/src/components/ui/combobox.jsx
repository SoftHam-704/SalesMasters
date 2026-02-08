import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

/**
 * Standard Combobox component for SalesMasters.
 * 
 * @param {Object} props
 * @param {Array<{value: string, label: string}>} props.items - List of items to select from.
 * @param {string} props.value - Currently selected value.
 * @param {Function} props.onChange - Callback when value changes.
 * @param {string} props.placeholder - Placeholder text when no item is selected.
 * @param {string} props.searchPlaceholder - Placeholder text for search input.
 * @param {string} props.emptyMessage - Message to display when no items found.
 * @param {boolean} props.disabled - Whether the combobox is disabled.
 * @param {string} props.className - Additional classes for the trigger button.
 */
export function Combobox({
    items = [],
    value,
    onChange,
    placeholder = "Selecione...",
    searchPlaceholder = "Buscar...",
    emptyMessage = "Nenhum item encontrado.",
    disabled = false,
    className
}) {
    const [open, setOpen] = React.useState(false)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn("w-full justify-between", className)}
                >
                    {value
                        ? items.find((item) => String(item.value) === String(value))?.label
                        : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <Command shouldFilter={true}>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>{emptyMessage}</CommandEmpty>
                        <CommandGroup>
                            {items.map((item) => (
                                <CommandItem
                                    key={item.value}
                                    value={item.label}
                                    onSelect={() => {
                                        onChange(item.value);
                                        setOpen(false);
                                    }}
                                    onPointerDown={(e) => e.preventDefault()}
                                    className="flex items-center px-4 py-3 cursor-pointer text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-tight aria-selected:bg-emerald-50 aria-selected:text-emerald-700 transition-colors pointer-events-auto"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            String(value) === String(item.value) ? "text-emerald-600 opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {item.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
