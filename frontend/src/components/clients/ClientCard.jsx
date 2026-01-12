import React from 'react';
import { motion } from 'framer-motion';
import {
    User, Phone, MapPin, Building2,
    Calendar, CheckCircle2, XCircle,
    MoreHorizontal, Edit, Trash2,
    ExternalLink, Map
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
    ContextMenu,
    ContextMenuTrigger,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator
} from '@/components/ui/context-menu';

const ClientCard = ({ client, index, onEdit, onDelete }) => {
    const isAtivo = client.cli_tipopes === 'A';

    return (
        <ContextMenu>
            <ContextMenuTrigger>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.05, 0.5) }}
                    className="group"
                >
                    <div className={cn(
                        "relative transition-all duration-500 rounded-2xl p-5 overflow-hidden bg-white border border-slate-200 shadow-sm hover:border-emerald-300",
                        isAtivo ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-rose-500",
                        "hover:bg-slate-50"
                    )}>
                        <div className="flex items-center gap-6">
                            {/* Client ID Section */}
                            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-100 border border-slate-200 w-24">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none mb-1 font-black">CÓDIGO</span>
                                <span className={`text-xl font-black ${isAtivo ? 'text-slate-700' : 'text-rose-600'} leading-tight`}>
                                    #{String(client.cli_codigo).padStart(4, '0')}
                                </span>
                            </div>

                            {/* Main Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="p-1.5 rounded-lg bg-blue-50">
                                        <Building2 className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <h3 className="text-base font-black text-slate-800 truncate uppercase tracking-tight">
                                        {client.cli_nomred || client.cli_nome}
                                    </h3>
                                    {client.cli_redeloja && (
                                        <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 text-[9px] font-black uppercase tracking-tight">
                                            {client.cli_redeloja}
                                        </Badge>
                                    )}
                                </div>

                                <p className="text-[11px] text-slate-400 truncate font-mono uppercase tracking-wider mb-3 font-bold">
                                    {client.cli_nome}
                                </p>

                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black whitespace-nowrap uppercase">
                                        <div className="p-1 rounded bg-slate-100"><MapPin className="w-3 h-3 text-emerald-600" /></div>
                                        {client.cli_cidade}/{client.cli_uf}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black whitespace-nowrap uppercase">
                                        <div className="p-1 rounded bg-slate-100"><Phone className="w-3 h-3 text-blue-600" /></div>
                                        {client.cli_fone1 || client.cli_fone2 || '—'}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black whitespace-nowrap font-mono uppercase">
                                        <div className="p-1 rounded bg-slate-100"><User className="w-3 h-3 text-indigo-600" /></div>
                                        {client.cli_cnpj}
                                    </div>
                                </div>
                            </div>

                            {/* Status & Region */}
                            <div className="flex flex-col gap-2 items-end justify-between self-stretch">
                                <div className={cn(
                                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border shadow-sm",
                                    isAtivo
                                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                        : "bg-rose-50 text-rose-600 border-rose-100"
                                )}>
                                    {isAtivo ? 'VIGENTE' : 'SUSPENSO'}
                                </div>

                                <div className="flex items-center gap-2 group/map cursor-pointer" title="Ver no Mapa">
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest group-hover/map:text-emerald-500 transition-colors">Região Tática</span>
                                    <div className="p-2 rounded-lg bg-slate-100 border border-slate-200 group-hover/map:border-emerald-300 transition-all">
                                        <Map className="w-3.5 h-3.5 text-slate-400 group-hover/map:text-emerald-500" />
                                    </div>
                                </div>
                            </div>

                            {/* Actions Area */}
                            <div className="flex flex-col gap-1.5 ml-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onEdit(client); }}
                                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-emerald-50 border border-slate-200 text-slate-400 hover:text-emerald-600 transition-all duration-300 shadow-sm"
                                    title="Editar"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete(client); }}
                                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 border border-slate-200 text-slate-400 hover:text-rose-600 transition-all duration-300 shadow-sm"
                                    title="Excluir"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <button
                                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-blue-50 border border-slate-200 text-slate-400 hover:text-blue-600 transition-all duration-300 shadow-sm"
                                    title="Abrir Dashboard do Cliente"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Visual Decorative Glow */}
                        <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-500" />
                    </div>
                </motion.div>
            </ContextMenuTrigger>

            <ContextMenuContent className="bg-white border-slate-200 text-slate-800 shadow-xl">
                <ContextMenuItem onClick={() => onEdit(client)} className="hover:bg-emerald-50 focus:bg-emerald-50 flex items-center gap-2">
                    <Edit className="h-4 w-4 text-emerald-600" />
                    <span className="font-bold">Editar Registro</span>
                </ContextMenuItem>
                <ContextMenuItem onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client.cli_endereco + ', ' + client.cli_cidade)}`)} className="hover:bg-blue-50 focus:bg-blue-50 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span className="font-bold">Ver Localização</span>
                </ContextMenuItem>
                <ContextMenuSeparator className="bg-slate-100" />
                <ContextMenuItem onClick={() => onDelete(client)} className="hover:bg-rose-50 focus:bg-rose-50 flex items-center gap-2 text-rose-600">
                    <Trash2 className="h-4 w-4" />
                    <span className="font-bold">Excluir Cliente</span>
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
};

export default ClientCard;
