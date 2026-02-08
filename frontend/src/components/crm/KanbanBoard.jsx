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

const SortableItem = ({ id, opportunity, onClick, onQuickAction }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="mb-3 group relative select-none"
            {...attributes}
            {...listeners}
            onClick={() => !isDragging && onClick(opportunity)}
        >
            <div className="stealth-card p-4 hover:border-blue-300 cursor-grab active:cursor-grabbing bg-white">
                <div className="flex justify-between items-start mb-3">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">ID: {opportunity.oportunidade_id}</span>
                    <Badge variant="outline" className="rounded-full border-blue-100 bg-blue-50 text-blue-600 text-[8px] font-bold uppercase tracking-tight">
                        {opportunity.industria_nome || 'GERAL'}
                    </Badge>
                </div>

                <h4 className="text-sm font-bold text-slate-800 tracking-tight mb-2 line-clamp-1">
                    {opportunity.titulo}
                </h4>

                <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                        <User size={12} className="text-slate-300" />
                        <span className="truncate">{opportunity.cli_nomred}</span>
                    </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-1 font-black text-blue-600 text-sm">
                        <span className="text-[9px] text-slate-400 font-bold">R$</span>
                        {parseFloat(opportunity.valor_estimado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    {opportunity.data_fechamento_prevista && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                            <Clock size={12} className="text-slate-300" />
                            {format(new Date(opportunity.data_fechamento_prevista), 'dd/MM')}
                        </div>
                    )}
                </div>

                {/* Quick Actions Overlay */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => { e.stopPropagation(); onQuickAction('whatsapp', opportunity); }}
                        className="w-8 h-8 bg-green-500 text-white flex items-center justify-center rounded-lg shadow-lg shadow-green-500/20 hover:bg-green-600 transition-colors"
                    >
                        <MessageCircle size={14} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onClick(opportunity); }}
                        className="w-8 h-8 bg-blue-600 text-white flex items-center justify-center rounded-lg shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-colors"
                    >
                        <Pencil size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

const KanbanColumn = ({ id, title, items, onCardClick, onQuickAction }) => {
    const { setNodeRef } = useSortable({ id: id, disabled: true });

    return (
        <div
            ref={setNodeRef}
            className="flex-shrink-0 w-80 flex flex-col h-full bg-slate-50/50 border-r border-slate-200 last:border-r-0"
        >
            <div className="p-5 flex justify-between items-center bg-white/40 backdrop-blur-sm border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-700">{title}</h3>
                </div>
                <Badge variant="secondary" className="bg-slate-200/50 text-slate-600 text-[10px] font-bold rounded-full px-2">
                    {items.length}
                </Badge>
            </div>

            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-1">
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
                    <div className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 opacity-50 bg-white/20">
                        <ShieldCheck size={20} className="text-slate-300" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Fluxo Livre</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function KanbanBoard({ pipeline, onDragEnd, onCardClick, onQuickAction }) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
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
            <div className="flex h-full overflow-x-auto pb-4 custom-scrollbar bg-white rounded-2xl shadow-inner border border-slate-100">
                {pipeline.map((stage) => (
                    <KanbanColumn
                        key={stage.etapa_id}
                        id={`stage-${stage.etapa_id}`}
                        title={stage.descricao}
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
