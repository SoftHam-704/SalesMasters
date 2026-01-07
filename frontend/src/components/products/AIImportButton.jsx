import { Sparkles, BrainCircuit, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AIImportButton({ onClick, disabled }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "group relative flex items-center justify-center gap-2 px-6 py-2 rounded-xl transition-all duration-500 ease-out h-[42px] border border-purple-200/50 overflow-hidden",
                "text-[10px] font-black uppercase tracking-widest whitespace-nowrap",
                "bg-slate-900 text-purple-400 shadow-xl",
                "hover:text-white hover:scale-105 hover:shadow-purple-500/40",
                "active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                "premium-shine"
            )}
        >
            {/* Background Animated Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900 via-purple-600 to-purple-900 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative flex items-center gap-2 z-10">
                <div className="relative">
                    <BrainCircuit className="h-4 w-4 transition-transform duration-700 group-hover:rotate-[15deg] group-hover:scale-125" strokeWidth={2.5} />
                    <Sparkles className="absolute -top-1 -right-1 h-2 w-2 text-white animate-pulse" />
                </div>
                <span className="relative font-black">AI IMPORT</span>
                <FileSpreadsheet className="h-3 w-3 opacity-60" />
            </div>

            {/* Ultra-premium glass reflection */}
            <div className="absolute top-0 left-0 w-full h-[50%] bg-white/10 skew-y-[-10deg] translate-y-[-50%] group-hover:translate-y-[-30%] transition-transform duration-700" />
        </button>
    );
}
