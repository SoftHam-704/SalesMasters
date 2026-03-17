import * as React from "react"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
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
 * Combobox with trigger styled identically to SelectTrigger.
 * Uses raw string concatenation (not cn/twMerge) to match SelectTrigger behavior.
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

    const selectedLabel = value
        ? items.find((item) => String(item.value) === String(value))?.label
        : null

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {/* Trigger uses SAME base classes + concatenation as SelectTrigger */}
                <button
                    type="button"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
                >
                    {selectedLabel || placeholder}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
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
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        onChange(item.value);
                                        setOpen(false);
                                    }}
                                    className="flex items-center px-4 py-3 cursor-pointer aria-selected:bg-stone-50 aria-selected:text-stone-900 transition-colors"
                                >
                                    <div className="flex items-start gap-3 w-full">
                                        <div className={cn(
                                            "flex items-center justify-center w-4 h-4 mt-0.5",
                                            String(value) === String(item.value) ? "opacity-100" : "opacity-0"
                                        )}>
                                            <Check className="w-4 h-4 text-stone-600" />
                                        </div>

                                        {item.icon && (
                                            <div className="mt-0.5 bg-stone-100 p-1.5 rounded-md text-stone-600">
                                                {item.icon}
                                            </div>
                                        )}

                                        <div className="flex flex-col text-left">
                                            <span className="font-sans font-semibold text-stone-800 text-sm leading-tight tracking-tight">
                                                {item.label}
                                            </span>
                                            {item.sublabel && (
                                                <span className="text-[10px] text-stone-400 font-mono mt-0.5 tracking-widest uppercase">
                                                    {item.sublabel}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
