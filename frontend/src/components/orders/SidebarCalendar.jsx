import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SidebarCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const today = new Date();

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const monthNames = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const prevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const days = [];
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);

    // Colunas de dias da semana
    const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

    for (let i = 0; i < startDay; i++) {
        days.push(<div key={`empty-${i}`} className="h-7 w-7" />);
    }

    for (let d = 1; d <= totalDays; d++) {
        const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
        days.push(
            <motion.div
                key={d}
                whileHover={{ scale: 1.15, zIndex: 10 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                    "h-7 w-7 flex items-center justify-center text-[10px] font-bold rounded-lg cursor-pointer transition-colors relative group",
                    isToday
                        ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/40"
                        : "hover:bg-emerald-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400"
                )}
            >
                {d}
                {!isToday && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0.5 h-0.5 bg-emerald-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 mx-2 mt-auto mb-4 bg-white/50 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-emerald-100/50 dark:border-white/5 shadow-xl shadow-emerald-500/5"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-100 dark:bg-emerald-500/10 rounded-lg">
                        <CalendarIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-300">
                            {monthNames[month]}
                        </h4>
                        <p className="text-[9px] font-bold text-emerald-600/60 dark:text-slate-500 leading-none">
                            {year}
                        </p>
                    </div>
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={prevMonth}
                        className="p-1 hover:bg-emerald-100 dark:hover:bg-white/5 rounded-md transition-colors"
                    >
                        <ChevronLeft className="h-3 w-3 text-emerald-600" />
                    </button>
                    <button
                        onClick={nextMonth}
                        className="p-1 hover:bg-emerald-100 dark:hover:bg-white/5 rounded-md transition-colors"
                    >
                        <ChevronRight className="h-3 w-3 text-emerald-600" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1">
                {weekDays.map((day, i) => (
                    <div key={i} className="h-7 w-7 flex items-center justify-center text-[9px] font-black text-emerald-800/30 dark:text-slate-600">
                        {day}
                    </div>
                ))}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${month}-${year}`}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="contents"
                    >
                        {days}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="mt-4 pt-3 border-t border-emerald-50 dark:border-white/5">
                <div className="flex items-center justify-between">
                    <div className="flex -space-x-1.5">
                        {[1, 2, 3].map(i => (
                            <div
                                key={i}
                                className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-800 bg-emerald-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden"
                            >
                                <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 opacity-60" />
                            </div>
                        ))}
                    </div>
                    <span className="text-[9px] font-bold text-emerald-600/80 dark:text-slate-500 italic">
                        Agendamentos hoje
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
