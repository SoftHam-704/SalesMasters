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
import { MoreHorizontal, Calendar, DollarSign, User } from 'lucide-react';
import { format } from 'date-fns';

// --- Sortable Item (Opportunity Card) ---
function SortableItem({ id, opportunity, onClick }) {
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

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-3 touch-none">
            <Card
                className="bg-white hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing border-slate-200"
                onClick={(e) => {
                    // Prevent click when dragging
                    if (!isDragging) onClick(opportunity);
                }}
            >
                <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className="text-[10px] px-1 py-0 border-slate-200 text-slate-500">
                            #{opportunity.oportunidade_id}
                        </Badge>
                        {opportunity.probabilidade > 70 && (
                            <Badge className="text-[10px] px-1 py-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                                🔥 Quente
                            </Badge>
                        )}
                    </div>
                    <h4 className="font-semibold text-slate-800 text-sm mb-1 line-clamp-2">
                        {opportunity.titulo}
                    </h4>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                        <User className="w-3 h-3" />
                        <span className="truncate">{opportunity.cli_nomred}</span>
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
function KanbanColumn({ id, title, items, color, onCardClick }) {
    const { setNodeRef } = useSortable({ id: id, disabled: true });

    return (
        <div ref={setNodeRef} className="flex-shrink-0 w-72 flex flex-col h-full bg-slate-50/50 rounded-xl border border-slate-100">
            {/* Column Header */}
            <div className={`p-3 border-b border-slate-100 rounded-t-xl flex justify-between items-center ${color.replace('bg-', 'bg-opacity-20 ')}`}>
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${color.replace('bg-', 'bg-')}`} />
                    <h3 className="font-semibold text-slate-700 text-sm">{title}</h3>
                </div>
                <Badge variant="secondary" className="bg-white text-slate-600 text-xs">
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

export default function KanbanBoard({ pipeline, onDragEnd, onCardClick }) {
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
