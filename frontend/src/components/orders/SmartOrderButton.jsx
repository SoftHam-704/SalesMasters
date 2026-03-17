import { Wand2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SmartOrderButton({ onClick, disabled }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "group relative flex items-center justify-center gap-3 px-8 py-3 rounded-full transition-all duration-500 ease-out h-[52px]",
                "text-[11px] font-mono uppercase tracking-[0.2em] whitespace-nowrap",
                "bg-white text-stone-900 border border-stone-200 shadow-sm",
                "hover:border-stone-400 hover:shadow-xl hover:-translate-y-1",
                "active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                "overflow-hidden"
            )}
        >
            {/* Subtle Animated Beam/Glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),rgba(244,63,94,0.1),transparent_70%)]" />

            <div className="relative flex items-center gap-3 z-10 transition-colors duration-300">
                <div className="relative flex items-center justify-center">
                    <Wand2 className="h-4 w-4 text-rose-500 transition-transform duration-700 group-hover:rotate-[360deg]" strokeWidth={2} />
                    <Sparkles className="absolute -top-1 -right-1 h-2 w-2 text-orange-400 animate-pulse" />
                </div>
                <span className="font-bold tracking-widest">F2 - MAGIC LOAD</span>
            </div>

            {/* Premium glass reflection */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
        </button>
    );
}
