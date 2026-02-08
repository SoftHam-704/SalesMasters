import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Factory, ChevronRight, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import SidebarCalendar from './SidebarCalendar';

import { NODE_API_URL, getApiUrl } from '../../utils/apiConfig';

export default function IndustryList({ selectedIndustry, onSelectIndustry }) {
    const [industries, setIndustries] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadIndustries();
    }, []);

    const loadIndustries = async () => {
        try {
            const response = await fetch(getApiUrl(NODE_API_URL, '/api/orders/industries'));
            const data = await response.json();

            if (data.success) {
                // Ordenar por nome
                const sorted = data.data.sort((a, b) =>
                    a.for_nomered.localeCompare(b.for_nomered)
                );
                setIndustries(sorted);
            }
        } catch (error) {
            console.error('Erro ao carregar indústrias:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-72 bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border-r border-emerald-200/50 dark:border-white/10 flex flex-col shadow-xl shadow-emerald-500/5"
        >
            {/* Header do Grid */}
            <div className="p-4 border-b border-emerald-200/50 dark:border-white/10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/30">
                        <Factory className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground text-sm">Indústrias</h3>
                        <p className="text-xs text-muted-foreground">{industries.length} cadastradas</p>
                    </div>
                </div>
            </div>

            {/* Lista de Indústrias */}
            <ScrollArea className="flex-1">
                {loading ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                        Carregando...
                    </div>
                ) : (
                    <div className="p-2 space-y-1">
                        {/* Opção Toda a Indústria */}
                        <motion.button
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={() => onSelectIndustry({ for_codigo: 'all', for_nomered: 'TODA INDÚSTRIA' })}
                            className={cn(
                                "w-full text-left px-3 py-2 rounded-xl transition-all duration-300 group mb-2 border border-dashed border-emerald-300",
                                selectedIndustry?.for_codigo === 'all'
                                    ? "bg-gradient-to-r from-slate-700 to-slate-900 shadow-lg shadow-slate-900/30"
                                    : "hover:bg-emerald-50 dark:hover:bg-white/5"
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={cn(
                                        "p-1 rounded-md",
                                        selectedIndustry?.for_codigo === 'all' ? "bg-white/20" : "bg-emerald-100"
                                    )}>
                                        <Globe className={cn(
                                            "h-3 w-3",
                                            selectedIndustry?.for_codigo === 'all' ? "text-white" : "text-emerald-700"
                                        )} />
                                    </div>
                                    <span className={cn(
                                        "font-black text-xs uppercase tracking-widest",
                                        selectedIndustry?.for_codigo === 'all' ? "text-white" : "text-slate-700"
                                    )}>
                                        Toda a Indústria
                                    </span>
                                </div>
                                <ChevronRight className={cn(
                                    "h-4 w-4",
                                    selectedIndustry?.for_codigo === 'all' ? "text-white" : "text-slate-300"
                                )} />
                            </div>
                        </motion.button>

                        {industries.map((industry, index) => (
                            <motion.button
                                key={industry.for_codigo}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.03 }}
                                onClick={() => onSelectIndustry(industry)}
                                className={cn(
                                    "w-full text-left px-3 py-2 rounded-xl transition-all duration-300 group",
                                    selectedIndustry?.for_codigo === industry.for_codigo
                                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30"
                                        : "hover:bg-emerald-100/50 dark:hover:bg-white/5 border border-transparent"
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "text-xs font-mono px-1.5 py-0.5 rounded-md",
                                            selectedIndustry?.for_codigo === industry.for_codigo
                                                ? "bg-white/20 text-white"
                                                : "bg-emerald-100 dark:bg-slate-700/50 text-emerald-700 dark:text-slate-400"
                                        )}>
                                            {String(industry.for_codigo).padStart(4, '0')}
                                        </span>
                                        <span className={cn(
                                            "font-medium text-sm",
                                            selectedIndustry?.for_codigo === industry.for_codigo ? "text-white" : "text-foreground"
                                        )}>
                                            {industry.for_nomered}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "text-xs font-mono",
                                            selectedIndustry?.for_codigo === industry.for_codigo
                                                ? "text-white/60"
                                                : "text-muted-foreground/60"
                                        )}>
                                            {String(industry.total_pedidos || 0).padStart(4, '0')}
                                        </span>
                                        <ChevronRight className={cn(
                                            "h-4 w-4 transition-transform",
                                            selectedIndustry?.for_codigo === industry.for_codigo
                                                ? "text-white translate-x-0"
                                                : "text-muted-foreground -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                                        )} />
                                    </div>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                )}
            </ScrollArea>

            {/* Sidebar Calendar */}
            <SidebarCalendar />
        </motion.div>
    );
}
