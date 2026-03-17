import React, { useState } from 'react';
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from "@/components/ui/badge";
import { User, Pencil, MessageCircle, Clock, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

const getStageColors = (stageId) => {
    const id = parseInt(stageId);
    switch (id) {
        case 1: // Prospecção
            return {
                text: "text-blue-600",
                bg: "bg-blue-50/50",
                border: "border-blue-100",
                dot: "bg-blue-500",
                shadow: "shadow-blue-500/10",
                hover: "hover:border-blue-300",
                badge: "bg-blue-50 border-blue-100 text-blue-600",
                columnIcon: "text-blue-400",
                columnBg: "bg-blue-50/20",
                borderTick: "bg-blue-500",
                clientText: "text-blue-600"
            };
        case 2: // Qualificação
            return {
                text: "text-indigo-600",
                bg: "bg-indigo-50/50",
                border: "border-indigo-100",
                dot: "bg-indigo-500",
                shadow: "shadow-indigo-500/10",
                hover: "hover:border-indigo-300",
                badge: "bg-indigo-50 border-indigo-100 text-indigo-600",
                columnIcon: "text-indigo-400",
                columnBg: "bg-indigo-50/20",
                borderTick: "bg-indigo-500",
                clientText: "text-blue-600"
            };
        case 3: // Proposta
            return {
                text: "text-amber-600",
                bg: "bg-amber-50/50",
                border: "border-amber-100",
                dot: "bg-amber-500",
                shadow: "shadow-amber-400/10",
                hover: "hover:border-amber-300",
                badge: "bg-amber-50 border-amber-100 text-amber-600",
                columnIcon: "text-amber-400",
                columnBg: "bg-amber-50/20",
                borderTick: "bg-amber-500",
                clientText: "text-blue-600"
            };
        case 4: // Negociação
            return {
                text: "text-orange-600",
                bg: "bg-orange-50/50",
                border: "border-orange-100",
                dot: "bg-orange-500",
                shadow: "shadow-orange-500/10",
                hover: "hover:border-orange-300",
                badge: "bg-orange-50 border-orange-100 text-orange-600",
                columnIcon: "text-orange-400",
                columnBg: "bg-orange-50/20",
                borderTick: "bg-orange-500",
                clientText: "text-blue-600"
            };
        case 5: // Fechamento
            return {
                text: "text-emerald-600",
                bg: "bg-emerald-50/50",
                border: "border-emerald-100",
                dot: "bg-emerald-500",
                shadow: "shadow-emerald-500/10",
                hover: "hover:border-emerald-300",
                badge: "bg-emerald-50 border-emerald-100 text-emerald-600",
                columnIcon: "text-emerald-400",
                columnBg: "bg-emerald-50/20",
                borderTick: "bg-emerald-500",
                clientText: "text-blue-600"
            };
        default:
            return {
                text: "text-slate-600",
                bg: "bg-slate-50/50",
                border: "border-slate-100",
                dot: "bg-slate-400",
                shadow: "shadow-slate-500/10",
                hover: "hover:border-slate-300",
                badge: "bg-slate-50 border-slate-100 text-slate-600",
                columnIcon: "text-slate-400",
                columnBg: "bg-slate-50/20",
                borderTick: "bg-slate-400",
                clientText: "text-blue-600"
            };
    }
};

const SortableItem = ({ id, opportunity, onClick, onQuickAction }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: id });

    const colors = getStageColors(opportunity.etapa_id);

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 1000 : 1
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="mb-3 group relative select-none touch-none"
            {...attributes}
            {...listeners}
            onClick={() => !isDragging && onClick(opportunity)}
        >
            <div className={cn(
                "stealth-card p-4 transition-all duration-300 bg-white rounded-xl border-l-[6px] border shadow-sm min-h-[140px] flex flex-col justify-between overflow-hidden",
                colors.border,
                `border-l-${colors.borderTick.split('-')[1]}-${colors.borderTick.split('-')[2]}`, // Tailwind trick: border-l-blue-500
                colors.shadow,
                colors.hover,
                isDragging ? "cursor-grabbing" : "cursor-grab"
            )}
            style={{ borderLeftColor: colors.dot === 'bg-slate-400' ? '#94a3b8' : undefined }} // Fail-safe for tailwind class logic
            >
                {/* Visual Accent Bar */}
                <div className={cn("absolute left-0 top-0 bottom-0 w-[6px]", colors.borderTick)} />

                <div>
                    <div className="flex justify-between items-start mb-2.5">
                        <span className="text-[10px] font-black text-slate-300 tracking-wider">#{opportunity.oportunidade_id}</span>
                        <Badge variant="outline" className={cn("rounded-md text-[8px] font-bold uppercase tracking-tight py-0.5", colors.badge)}>
                            {opportunity.industria_nome || 'GERAL'}
                        </Badge>
                    </div>

                    <h4 className={cn(
                        "text-[14px] font-black tracking-tight mb-1 line-clamp-1 transition-colors leading-tight",
                        colors.clientText
                    )}>
                        {opportunity.cli_nomred}
                    </h4>

                    <p className="text-[12px] font-bold text-slate-600 line-clamp-2 leading-snug mb-3">
                        {opportunity.titulo}
                    </p>
                </div>

                <div className="pt-2.5 border-t border-slate-50 flex justify-between items-end group-hover:border-slate-100 transition-colors">
                    <div className="space-y-0.5">
                        <span className="text-[9px] font-black text-slate-300 uppercase block leading-none">Valor Estimado</span>
                        <div className={cn("flex items-center gap-1 font-black text-base", colors.text)}>
                            <span className="text-[10px] opacity-60 font-bold">R$</span>
                            {parseFloat(opportunity.valor_estimado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                    {opportunity.data_fechamento_prevista && (
                        <div className="flex flex-col items-end gap-1">
                            <span className="text-[9px] font-black text-slate-300 uppercase leading-none">Previsão</span>
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold bg-slate-50/80 px-2 py-0.5 rounded-md border border-slate-100">
                                <Clock size={10} className="text-slate-300" />
                                {format(new Date(opportunity.data_fechamento_prevista), 'dd/MM')}
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick Actions Overlay */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
                    <button
                        onClick={(e) => { e.stopPropagation(); onQuickAction('whatsapp', opportunity); }}
                        className="w-7 h-7 bg-emerald-500 text-white flex items-center justify-center rounded-lg shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all hover:scale-110 active:scale-95"
                    >
                        <MessageCircle size={12} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onClick(opportunity); }}
                        className="w-7 h-7 bg-white border border-slate-200 text-slate-400 flex items-center justify-center rounded-lg shadow-sm hover:text-slate-600 hover:border-slate-300 transition-all hover:scale-110 active:scale-95"
                    >
                        <Pencil size={12} />
                    </button>
                </div>
            </div>
        </div>
    );
};

const KanbanColumn = ({ id, title, items, onCardClick, onQuickAction }) => {
    const stageId = id.replace('stage-', '');
    const { setNodeRef, isOver } = useSortable({ id: id, disabled: true });
    const colors = getStageColors(stageId);

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "flex-shrink-0 w-80 flex flex-col h-full border-r border-slate-100/60 last:border-r-0 transition-colors duration-500",
                isOver ? colors.columnBg : "bg-transparent"
            )}
        >
            <div className="p-4 flex flex-col gap-1 bg-white/40 backdrop-blur-xl border-b border-slate-100/50 sticky top-0 z-10 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.02)]">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                        <div className={cn("w-2.5 h-2.5 rounded-full shadow-sm", colors.dot)} />
                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-800">{title}</h3>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 bg-slate-100/80 px-2 py-0.5 rounded-full border border-slate-200/50 min-w-[24px] text-center">
                        {items.length}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 pl-5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Total em aberto</span>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-slate-100 to-transparent" />
                </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-3 min-h-[200px]">
                <SortableContext
                    id={id}
                    items={items.map(op => `opp-${op.oportunidade_id}`)}
                    strategy={verticalListSortingStrategy}
                >
                    {items.map((op) => (
                        <SortableItem
                            key={`opp-${op.oportunidade_id}`}
                            id={`opp-${op.oportunidade_id}`}
                            opportunity={op}
                            onClick={onCardClick}
                            onQuickAction={onQuickAction}
                        />
                    ))}
                </SortableContext>

                {items.length === 0 && (
                    <div className="h-32 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center gap-3 opacity-40 bg-white/10 transition-all duration-500 hover:opacity-100 hover:bg-white/30 group">
                        <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-50 group-hover:scale-110 transition-transform">
                            <ShieldCheck size={18} className={cn("text-slate-200", colors.columnIcon)} />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Fluxo Disponível</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function KanbanBoard({ pipeline, onDragEnd, onCardClick, onQuickAction }) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const [activeItem, setActiveItem] = useState(null);

    const handleDragStart = (event) => {
        const { active } = event;
        for (const stage of pipeline) {
            const found = stage.items.find(i => `opp-${i.oportunidade_id}` === active.id);
            if (found) { setActiveItem(found); break; }
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={onDragEnd}
        >
            <div className="flex h-full overflow-x-auto pb-4 custom-scrollbar bg-white/40 backdrop-blur-md rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.03)] border border-white/60">
                {pipeline.map((stage) => (
                    <KanbanColumn
                        key={stage.etapa_id}
                        id={`stage-${stage.etapa_id}`}
                        title={stage.descricao || stage.titulo || stage.nome}
                        items={stage.items}
                        onCardClick={onCardClick}
                        onQuickAction={onQuickAction}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeItem ? (
                    <div className="w-72 rotate-3 opacity-90 cursor-grabbing shadow-2xl">
                        <div className="stealth-card p-4 border-blue-500 bg-white">
                            <h4 className="text-sm font-bold text-slate-800">{activeItem.titulo}</h4>
                            <div className="text-blue-600 font-black text-sm mt-2">
                                {parseFloat(activeItem.valor_estimado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                        </div>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
