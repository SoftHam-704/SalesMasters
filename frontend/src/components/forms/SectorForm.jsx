import React, { useState, useEffect } from 'react';
import { FileText, MapPin, Palette } from 'lucide-react';
import FormCadPadraoV2 from '../FormCadPadraoV2';
import InputField from '../InputField';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import DbComboBox from '../DbComboBox';
import { toast } from "sonner";
import { NODE_API_URL, getApiUrl } from '../../utils/apiConfig';

const SectorForm = ({ data, defaultCityId, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        set_descricao: '',
        set_cidade_id: defaultCityId || null,
        set_ordem: 0,
        set_cor: '#3B82F6',
        set_observacao: ''
    });

    const [selectedCity, setSelectedCity] = useState(null);

    useEffect(() => {
        if (data) {
            setFormData({
                set_descricao: data.set_descricao || '',
                set_cidade_id: data.set_cidade_id || null,
                set_ordem: data.set_ordem || 0,
                set_cor: data.set_cor || '#3B82F6',
                set_observacao: data.set_observacao || ''
            });

            if (data.cid_nome) {
                setSelectedCity({
                    cid_codigo: data.set_cidade_id,
                    cid_nome: data.cid_nome,
                    cid_uf: data.cid_uf,
                    full_name: `${data.cid_nome} - ${data.cid_uf}`
                });
            }
        }
    }, [data]);

    // Load default city if provided
    useEffect(() => {
        if (defaultCityId && !data) {
            // Fetch city details
            fetch(getApiUrl(NODE_API_URL, `/api/v2/cities?search=&limit=100`))
                .then(res => res.json())
                .then(json => {
                    const city = (json.data || []).find(c => c.cid_codigo === defaultCityId);
                    if (city) {
                        setSelectedCity({
                            ...city,
                            full_name: `${city.cid_nome} - ${city.cid_uf}`
                        });
                        setFormData(prev => ({ ...prev, set_cidade_id: defaultCityId }));
                    }
                });
        }
    }, [defaultCityId, data]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleCityChange = (city) => {
        setSelectedCity(city);
        setFormData(prev => ({ ...prev, set_cidade_id: city?.cid_codigo || null }));
    };

    const handleSave = () => {
        if (!formData.set_descricao?.trim()) {
            toast.error('Descrição é obrigatória');
            return;
        }
        if (!formData.set_cidade_id) {
            toast.error('Selecione uma cidade');
            return;
        }
        onSave(formData);
    };

    // Predefined colors for quick selection
    const colorOptions = [
        '#3B82F6', // Blue
        '#10B981', // Emerald
        '#F59E0B', // Amber
        '#EF4444', // Red
        '#8B5CF6', // Violet
        '#EC4899', // Pink
        '#06B6D4', // Cyan
        '#84CC16', // Lime
        '#F97316', // Orange
        '#6366F1', // Indigo
    ];

    return (
        <FormCadPadraoV2
            title={data ? `Setor: ${data.set_descricao || ''}` : "Novo Setor"}
            onSave={handleSave}
            onCancel={onClose}
        >
            <div className="p-6 space-y-6">
                {/* Descrição */}
                <div>
                    <InputField
                        label="Descrição do Setor"
                        value={formData.set_descricao}
                        onChange={(e) => handleChange('set_descricao', e.target.value)}
                        placeholder="Ex: Setor Bueno, Centro, Zona Sul..."
                        autoFocus
                        large
                    />
                </div>

                {/* Cidade */}
                <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                        Cidade <span className="text-red-500">*</span>
                    </Label>
                    <DbComboBox
                        placeholder="Selecione a cidade..."
                        value={selectedCity}
                        onChange={handleCityChange}
                        fetchData={async (search = '', limit = 30) => {
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

                <div className="grid grid-cols-2 gap-4">
                    {/* Ordem */}
                    <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                            Ordem de Visita
                        </Label>
                        <Input
                            type="number"
                            value={formData.set_ordem}
                            onChange={(e) => handleChange('set_ordem', parseInt(e.target.value) || 0)}
                            placeholder="0"
                            className="h-10"
                        />
                        <p className="text-xs text-gray-500 mt-1">Define a prioridade de visita (menor = primeiro)</p>
                    </div>

                    {/* Cor */}
                    <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-2">
                            <Palette size={16} />
                            Cor do Setor
                        </Label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={formData.set_cor}
                                onChange={(e) => handleChange('set_cor', e.target.value)}
                                className="w-10 h-10 rounded cursor-pointer border border-gray-300"
                            />
                            <div className="flex gap-1 flex-wrap">
                                {colorOptions.map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => handleChange('set_cor', color)}
                                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${formData.set_cor === color ? 'border-gray-800 ring-2 ring-offset-1 ring-gray-400' : 'border-gray-200'}`}
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Observação */}
                <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                        Observações
                    </Label>
                    <Textarea
                        value={formData.set_observacao}
                        onChange={(e) => handleChange('set_observacao', e.target.value)}
                        placeholder="Informações adicionais sobre o setor..."
                        rows={3}
                        className="resize-none"
                    />
                </div>
            </div>
        </FormCadPadraoV2>
    );
};

export default SectorForm;
