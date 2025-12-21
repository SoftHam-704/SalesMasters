import * as React from "react"
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu"

const ContextMenu = ContextMenuPrimitive.Root
const ContextMenuTrigger = ContextMenuPrimitive.Trigger

const ContextMenuContent = React.forwardRef(({ className, ...props }, ref) => (
    <ContextMenuPrimitive.Portal>
        <ContextMenuPrimitive.Content
            ref={ref}
            className={`
        z-50 min-w-[200px] overflow-hidden rounded-md border bg-white p-1 shadow-md
        animate-in fade-in-80 data-[state=open]:animate-in data-[state=closed]:animate-out
        data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
        data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
        ${className || ''}
      `}
            {...props}
        />
    </ContextMenuPrimitive.Portal>
))
ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName

const ContextMenuItem = React.forwardRef(({ className, ...props }, ref) => (
    <ContextMenuPrimitive.Item
        ref={ref}
        className={`
      relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none
      hover:bg-blue-500 hover:text-white
      focus:bg-blue-500 focus:text-white
      data-[disabled]:pointer-events-none data-[disabled]:opacity-50
      ${className || ''}
    `}
        {...props}
    />
))
ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName

const ContextMenuSeparator = React.forwardRef(({ className, ...props }, ref) => (
    <ContextMenuPrimitive.Separator
        ref={ref}
        className={`-mx-1 my-1 h-px bg-gray-200 ${className || ''}`}
        {...props}
    />
))
ContextMenuSeparator.displayName = ContextMenuPrimitive.Separator.displayName

export {
    ContextMenu,
    ContextMenuTrigger,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
}
