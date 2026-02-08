import { Wand2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SmartOrderButton({ onClick, disabled }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "group relative flex items-center justify-center gap-2 px-6 py-2 rounded-xl transition-all duration-500 ease-out h-[48px] min-w-[130px] border border-rose-200/50 overflow-hidden",
                "text-[10px] font-black uppercase tracking-widest whitespace-nowrap",
                "bg-slate-900 text-rose-400 shadow-xl",
                "hover:text-white hover:scale-105 hover:shadow-rose-500/40",
                "active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                "premium-shine"
            )}
        >
            {/* Background Animated Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-rose-900 via-rose-600 to-rose-900 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative flex items-center gap-2 z-10">
                <div className="relative">
                    <Wand2 className="h-4 w-4 transition-transform duration-700 group-hover:rotate-[360deg] group-hover:scale-125" strokeWidth={2.5} />
                    <Sparkles className="absolute -top-1 -right-1 h-2 w-2 text-white animate-pulse" />
                </div>
                <span className="relative font-black">F2 - MAGIC LOAD</span>
            </div>

            {/* Ultra-premium glass reflection */}
            <div className="absolute top-0 left-0 w-full h-[50%] bg-white/10 skew-y-[-10deg] translate-y-[-50%] group-hover:translate-y-[-30%] transition-transform duration-700" />
        </button>
    );
}
