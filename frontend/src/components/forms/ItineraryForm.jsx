import React, { useState, useEffect } from 'react';
import { Route, MapPin, Plus, Trash2, GripVertical, Building2 } from 'lucide-react';
import FormCadPadraoV2 from '../FormCadPadraoV2';
import InputField from '../InputField';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import DbComboBox from '../DbComboBox';
import { toast } from "sonner";
import { NODE_API_URL, getApiUrl } from '../../utils/apiConfig';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const ItineraryForm = ({ data, onClose, onSave }) => {
    const [header, setHeader] = useState({
        iti_descricao: '',
        iti_vendedor_id: null,
        iti_frequencia: 'SEMANAL',
        iti_observacao: ''
    });

    const [items, setItems] = useState([]);
    const [sellers, setSellers] = useState([]);

    // --- Aux Data Loaders ---
    useEffect(() => {
        // Load Sellers
        fetch(getApiUrl(NODE_API_URL, '/api/aux/vendedores'))
            .then(res => res.json())
            .then(json => setSellers(json.data || []));

        if (data) {
            // Load Header
            setHeader({
                iti_descricao: data.iti_descricao || '',
                iti_vendedor_id: data.iti_vendedor_id || null,
                iti_frequencia: data.iti_frequencia || 'SEMANAL',
                iti_observacao: data.iti_observacao || ''
            });

            // Load Items
            fetch(getApiUrl(NODE_API_URL, `/api/v2/itineraries/${data.iti_codigo}`))
                .then(res => res.json())
                .then(json => {
                    if (json.success && json.data.items) {
                        setItems(json.data.items.map(item => ({
                            _tempId: Math.random().toString(36), // ID for drag-drop
                            ite_tipo: item.ite_tipo,
                            ite_cidade_id: item.ite_cidade_id,
                            ite_setor_id: item.ite_setor_id,
                            cityName: item.cid_nome + ' - ' + item.cid_uf,
                            sectorName: item.set_descricao,
                            sectorColor: item.set_cor
                        })));
                    }
                });
        }
    }, [data]);

    const handleHeaderChange = (field, value) => {
        setHeader(prev => ({ ...prev, [field]: value }));
    };

    // --- Items Logic ---
    const [newItemType, setNewItemType] = useState('C'); // C=Cidade, S=Setor
    const [selectedCity, setSelectedCity] = useState(null);
    const [selectedSector, setSelectedSector] = useState(null);
    const [availableSectors, setAvailableSectors] = useState([]);

    // Load sectors when city selected (if type is Sector)
    useEffect(() => {
        if (newItemType === 'S' && selectedCity) {
            fetch(getApiUrl(NODE_API_URL, `/api/v2/sectors?city_id=${selectedCity.cid_codigo}`))
                .then(res => res.json())
                .then(json => setAvailableSectors(json.data || []));
        } else {
            setAvailableSectors([]);
        }
    }, [newItemType, selectedCity]);

    const handleAddItem = () => {
        if (!selectedCity) {
            toast.error('Selecione uma cidade');
            return;
        }
        if (newItemType === 'S' && !selectedSector) {
            toast.error('Selecione um setor');
            return;
        }

        const newItem = {
            _tempId: Math.random().toString(36),
            ite_tipo: newItemType,
            ite_cidade_id: selectedCity.cid_codigo,
            cityName: `${selectedCity.cid_nome} - ${selectedCity.cid_uf}`,
            // Optional Sector
            ite_setor_id: selectedSector ? selectedSector.set_codigo : null,
            sectorName: selectedSector ? selectedSector.set_descricao : null,
            sectorColor: selectedSector ? selectedSector.set_cor : null
        };

        setItems(prev => [...prev, newItem]);

        // Reset inputs but keep city if type is sector (UX optimization)
        if (newItemType === 'C') {
            setSelectedCity(null);
        }
        setSelectedSector(null);
    };

    const handleRemoveItem = (index) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleDragEnd = (result) => {
        if (!result.destination) return;
        const reordered = Array.from(items);
        const [removed] = reordered.splice(result.source.index, 1);
        reordered.splice(result.destination.index, 0, removed);
        setItems(reordered);
    };

    const handleSave = () => {
        if (!header.iti_descricao.trim()) {
            toast.error('Nome do itinerário é obrigatório');
            return;
        }
        if (items.length === 0) {
            toast.error('Adicione pelo menos um local ao itinerário');
            return;
        }

        onSave({
            ...header,
            items: items.map((item, idx) => ({
                ite_tipo: item.ite_tipo,
                ite_cidade_id: item.ite_cidade_id,
                ite_setor_id: item.ite_setor_id,
                ite_ordem: idx
            }))
        });
    };

    return (
        <FormCadPadraoV2
            title={data ? `Editar Itinerário: ${data.iti_descricao}` : "Novo Itinerário de Visita"}
            onSave={handleSave}
            onCancel={onClose}
        >
            <div className="flex h-full flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-200">
                {/* Left: Headers & Add Logic */}
                <div className="w-full md:w-1/3 p-6 space-y-6 bg-gray-50/50">
                    <div>
                        <Label className="font-semibold text-gray-700">Nome do Itinerário</Label>
                        <Input
                            value={header.iti_descricao}
                            onChange={(e) => handleHeaderChange('iti_descricao', e.target.value)}
                            placeholder="Ex: Rota Segunda-Feira (Sul)"
                            className="bg-white"
                        />
                    </div>

                    <div>
                        <Label className="font-semibold text-gray-700">Vendedor Responsável (Opcional)</Label>
                        <Select
                            value={header.iti_vendedor_id?.toString()}
                            onValueChange={(val) => handleHeaderChange('iti_vendedor_id', parseInt(val))}
                        >
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent className="z-[9999]">
                                <SelectItem value="0">-- Nenhum (Geral) --</SelectItem>
                                {sellers.map(s => (
                                    <SelectItem key={s.ven_codigo} value={s.ven_codigo.toString()}>{s.ven_nome}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label className="font-semibold text-gray-700">Frequência</Label>
                        <Select
                            value={header.iti_frequencia}
                            onValueChange={(val) => handleHeaderChange('iti_frequencia', val)}
                        >
                            <SelectTrigger className="bg-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-[9999]">
                                <SelectItem value="SEMANAL">Semanal</SelectItem>
                                <SelectItem value="QUINZENAL">Quinzenal</SelectItem>
                                <SelectItem value="MENSAL">Mensal</SelectItem>
                                <SelectItem value="ESPORADICO">Esporádico</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                        <Label className="font-bold text-gray-800 mb-2 block">Adicionar Locais</Label>

                        <div className="space-y-3">
                            {/* Type Toggle */}
                            <div className="flex bg-white rounded-lg p-1 border shadow-sm">
                                <button
                                    type="button"
                                    onClick={() => setNewItemType('C')}
                                    className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors ${newItemType === 'C' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    Cidade Inteira
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setNewItemType('S')}
                                    className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors ${newItemType === 'S' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    Setor / Bairro
                                </button>
                            </div>

                            {/* City Select */}
                            <div>
                                <Label className="text-xs text-gray-500">Cidade</Label>
                                <DbComboBox
                                    placeholder="Buscar cidade..."
                                    value={selectedCity}
                                    onChange={(city) => {
                                        setSelectedCity(city);
                                        setSelectedSector(null);
                                    }}
                                    fetchData={async (search = '', limit = 20) => {
                                        const res = await fetch(getApiUrl(NODE_API_URL, `/api/v2/cities?search=${encodeURIComponent(search)}&limit=${limit}`));
                                        const json = await res.json();
                                        return (json.data || []).map(city => ({
                                            ...city,
                                            full_name: `${city.cid_nome} - ${city.cid_uf}`
                                        }));
                                    }}
                                    labelKey="full_name"
                                    valueKey="cid_codigo"
                                />
                            </div>

                            {/* Sector Select (Conditional) */}
                            {newItemType === 'S' && (
                                <div>
                                    <Label className="text-xs text-gray-500">Setor</Label>
                                    <Select
                                        value={selectedSector?.set_codigo?.toString()}
                                        onValueChange={(val) => {
                                            const sec = availableSectors.find(s => s.set_codigo.toString() === val);
                                            setSelectedSector(sec);
                                        }}
                                        disabled={!selectedCity || availableSectors.length === 0}
                                    >
                                        <SelectTrigger className="bg-white">
                                            <SelectValue placeholder={!selectedCity ? "Escolha a cidade" : availableSectors.length === 0 ? "Nenhum setor encontrado" : "Selecione o setor..."} />
                                        </SelectTrigger>
                                        <SelectContent className="z-[9999]">
                                            {availableSectors.map(s => (
                                                <SelectItem key={s.set_codigo} value={s.set_codigo.toString()}>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.set_cor }} />
                                                        {s.set_descricao}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <Button
                                onClick={handleAddItem}
                                className="w-full flex items-center gap-2"
                                variant={newItemType === 'C' ? 'default' : 'secondary'}
                            >
                                <Plus size={16} />
                                Adicionar {newItemType === 'C' ? 'Cidade' : 'Setor'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right: Items List (Drag & Drop) */}
                <div className="w-full md:w-2/3 p-6 bg-white overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <Label className="font-bold text-lg text-gray-800 flex items-center gap-2">
                            <Route className="text-blue-500" />
                            Roteiro de Visitas
                        </Label>
                        <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-1 rounded">
                            Arraste para reordenar
                        </span>
                    </div>

                    <div className="flex-1 overflow-auto bg-gray-50 rounded-xl border border-gray-100 p-2">
                        <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId="items">
                                {(provided) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="space-y-2"
                                    >
                                        {items.map((item, index) => (
                                            <Draggable key={item._tempId} draggableId={item._tempId} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${snapshot.isDragging ? 'bg-blue-50 border-blue-300 shadow-lg scale-105 z-50' : 'bg-white border-gray-100 hover:border-gray-300 shadow-sm'}`}
                                                    >
                                                        <div {...provided.dragHandleProps} className="cursor-grab text-gray-300 hover:text-gray-500">
                                                            <GripVertical size={20} />
                                                        </div>

                                                        {/* Number Badge */}
                                                        <div className="w-6 h-6 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                                                            {index + 1}
                                                        </div>

                                                        {/* Icon Type */}
                                                        <div className={`p-2 rounded-lg ${item.ite_tipo === 'C' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                            {item.ite_tipo === 'C' ? <Building2 size={16} /> : <MapPin size={16} />}
                                                        </div>

                                                        {/* Content */}
                                                        <div className="flex-1">
                                                            {item.ite_tipo === 'C' ? (
                                                                <div className="font-semibold text-gray-800">{item.cityName}</div>
                                                            ) : (
                                                                <div>
                                                                    <div className="font-semibold text-gray-800 flex items-center gap-2">
                                                                        {item.sectorName}
                                                                        {item.sectorColor && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.sectorColor }} />}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">{item.cityName}</div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Badges */}
                                                        <div className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-gray-100 text-gray-600">
                                                            {item.ite_tipo === 'C' ? 'CIDADE INTEIRA' : 'SETOR'}
                                                        </div>

                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                                                            onClick={() => handleRemoveItem(index)}
                                                        >
                                                            <Trash2 size={16} />
                                                        </Button>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>

                        {items.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                                <MapPin size={48} className="mb-2" />
                                <p className="text-sm font-medium">Nenhum local adicionado ao roteiro.</p>
                                <p className="text-xs">Utilize o painel à esquerda para adicionar.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </FormCadPadraoV2>
    );
};

export default ItineraryForm;
