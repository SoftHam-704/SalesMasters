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
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Calendar, DollarSign, User, Building2, Pencil } from 'lucide-react';
import { format } from 'date-fns';

// --- Sortable Item (Opportunity Card) ---
function SortableItem({ id, opportunity, onClick, onQuickAction }) {
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
        opacity: isDragging ? 0.5 : 1,
    };

    const handleWhatsAppClick = (e) => {
        e.stopPropagation(); // Prevents card opening
        e.preventDefault();
        const phone = opportunity.cli_fone1?.replace(/\D/g, '');
        if (phone && onQuickAction) {
            onQuickAction('whatsapp', opportunity);
        }
    };

    const handleEditClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (onClick && typeof onClick === 'function') {
            onClick(opportunity);
        }
    };

    return (
        <div ref={setNodeRef} style={style} className="mb-3 touch-none">
            {/* Drag Handle - only this area is draggable */}
            <Card
                className="bg-white hover:shadow-md transition-shadow border-slate-200 group relative"
                {...attributes}
                {...listeners}
                onClick={(e) => {
                    // Prevent click when dragging
                    if (!isDragging) onClick(opportunity);
                }}
            >
                <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-2">
                        {/* Industry Badge (Top Left) */}
                        {opportunity.industria_nome ? (
                            <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-blue-50 text-blue-700 hover:bg-blue-100 flex gap-1 items-center border border-blue-100">
                                <Building2 className="w-3 h-3" />
                                {opportunity.industria_nome}
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="text-[10px] px-1 py-0 border-slate-200 text-slate-500">
                                #{opportunity.oportunidade_id}
                            </Badge>
                        )}

                        <div className="flex gap-1" onPointerDown={(e) => e.stopPropagation()}>
                            {/* Edit Button */}
                            <button
                                onClick={handleEditClick}
                                onPointerDown={(e) => e.stopPropagation()}
                                className="p-1.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors opacity-0 group-hover:opacity-100 shadow-sm cursor-pointer touch-none z-10"
                                title="Editar Oportunidade"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                            </button>

                            {/* WhatsApp Quick Action */}
                            {(opportunity.telefone_contato || opportunity.cli_fone1) && (
                                <button
                                    onClick={handleWhatsAppClick}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    className="p-1.5 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors opacity-0 group-hover:opacity-100 shadow-sm cursor-pointer touch-none z-10"
                                    title="WhatsApp Rápido"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
                                </button>
                            )}
                        </div>
                    </div>

                    <h4 className="font-semibold text-slate-800 text-sm mb-1 line-clamp-2">
                        {opportunity.titulo}
                    </h4>

                    <div className="flex flex-col gap-1 mb-2">
                        {/* Client */}
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                            <User className="w-3 h-3 text-slate-400" />
                            <span className="truncate">{opportunity.cli_nomred}</span>
                        </div>
                        {/* Promoter / Seller */}
                        {opportunity.promotor_nome && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                <span className="font-medium text-slate-500">Promotor:</span>
                                {opportunity.promotor_nome}
                            </div>
                        )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                        <div className="flex items-center gap-1 font-bold text-slate-700 text-sm">
                            <DollarSign className="w-3 h-3 text-emerald-600" />
                            {parseFloat(opportunity.valor_estimado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        {opportunity.data_fechamento_prevista && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(opportunity.data_fechamento_prevista), 'dd/MM')}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// --- Column (Stage) ---
function KanbanColumn({ id, title, items, color, onCardClick, onQuickAction }) {
    const { setNodeRef } = useSortable({ id: id, disabled: true });

    return (
        <div
            ref={setNodeRef}
            className="flex-shrink-0 w-72 flex flex-col h-full bg-gradient-to-b from-white to-slate-50 rounded-2xl border-2 border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300"
            style={{
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                transform: 'perspective(1000px) rotateX(1deg)',
            }}
        >
            {/* Column Header - 3D Effect */}
            <div className={`p-4 border-b-2 border-slate-200 rounded-t-2xl flex justify-between items-center bg-gradient-to-r ${color === 'bg-blue-500' ? 'from-blue-50 to-blue-100' :
                color === 'bg-cyan-500' ? 'from-cyan-50 to-cyan-100' :
                    color === 'bg-amber-500' ? 'from-amber-50 to-amber-100' :
                        color === 'bg-orange-500' ? 'from-orange-50 to-orange-100' :
                            color === 'bg-emerald-500' ? 'from-emerald-50 to-emerald-100' :
                                'from-slate-50 to-slate-100'
                }`}>
                <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${color} shadow-md ring-2 ring-white`} />
                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">{title}</h3>
                </div>
                <Badge variant="secondary" className="bg-white text-slate-700 text-xs font-bold shadow-sm border border-slate-200 px-2.5">
                    {items.length}
                </Badge>
            </div>

            {/* Sortable Area */}
            <div className="flex-1 p-2 overflow-y-auto">
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
                    <div className="h-24 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-xs">
                        Arraste aqui
                    </div>
                )}
            </div>
        </div>
    );
}

export default function KanbanBoard({ pipeline, onDragEnd, onCardClick, onQuickAction }) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const [activeId, setActiveId] = useState(null);
    const [activeItem, setActiveItem] = useState(null);

    const handleDragStart = (event) => {
        const { active } = event;
        setActiveId(active.id);
        // Find the item object
        for (const stage of pipeline) {
            const found = stage.items.find(i => `opp-${i.oportunidade_id}` === active.id);
            if (found) {
                setActiveItem(found);
                break;
            }
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={onDragEnd}
        >
            <div className="flex h-full gap-4 overflow-x-auto pb-4 px-2">
                {pipeline.map((stage) => (
                    <KanbanColumn
                        key={stage.etapa_id}
                        id={`stage-${stage.etapa_id}`}
                        title={stage.descricao}
                        color={stage.cor || 'bg-slate-100'}
                        items={stage.items}
                        onCardClick={onCardClick}
                        onQuickAction={onQuickAction}
                    />
                ))}
            </div>

            {/* Drag Overlay (Visual Preview) */}
            <DragOverlay>
                {activeItem ? (
                    <div className="w-72 opacity-90 rotate-3 cursor-grabbing">
                        <Card className="bg-white shadow-xl border-blue-200">
                            <CardContent className="p-3">
                                <h4 className="font-semibold text-slate-800 text-sm mb-1">{activeItem.titulo}</h4>
                                <div className="flex items-center gap-1 font-bold text-slate-700 text-sm">
                                    <DollarSign className="w-3 h-3 text-emerald-600" />
                                    {parseFloat(activeItem.valor_estimado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
