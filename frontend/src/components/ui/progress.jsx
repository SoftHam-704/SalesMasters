import * as React from "react"
import { cn } from "@/lib/utils"

const Progress = React.forwardRef(({ className, value, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "relative h-4 w-full overflow-hidden rounded-full bg-slate-200",
            className
        )}
        {...props}
    >
        <div
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500 ease-out"
            style={{ width: `${value || 0}%` }}
        />
    </div>
))
Progress.displayName = "Progress"

export { Progress }
