import React, { useState, useEffect } from 'react';
import { FileText, MapPin, Trash2, Plus } from 'lucide-react';
import FormCadPadraoV2 from '../FormCadPadraoV2';
import InputField from '../InputField';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import DbComboBox from '../DbComboBox';
import { toast } from "sonner";

const RegionForm = ({ data, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        reg_descricao: ''
    });

    const [regionCities, setRegionCities] = useState([]);
    const [selectedCity, setSelectedCity] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (data) {
            setFormData({
                reg_descricao: data.reg_descricao || ''
            });
            fetchRegionCities();
        }
    }, [data]);

    const fetchRegionCities = async () => {
        if (!data?.reg_codigo) return;

        setLoading(true);
        try {
            const response = await fetch(`https://salesmasters.softham.com.br/api/v2/regions/${data.reg_codigo}/cities`);
            const result = await response.json();
            if (result.success) {
                setRegionCities(result.data);
            }
        } catch (error) {
            console.error('Erro ao carregar cidades da região:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCity = async () => {
        if (!selectedCity) {
            toast.error('Selecione uma cidade');
            return;
        }

        if (!data?.reg_codigo) {
            toast.error('Salve a região antes de adicionar cidades');
            return;
        }

        try {
            const response = await fetch(`https://salesmasters.softham.com.br/api/v2/regions/${data.reg_codigo}/cities`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cid_id: selectedCity.cid_codigo })
            });

            const result = await response.json();

            if (result.success) {
                toast.success(result.message);
                setSelectedCity(null);
                fetchRegionCities();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            console.error('Erro ao adicionar cidade:', error);
            toast.error('Erro ao adicionar cidade');
        }
    };

    const handleRemoveCity = async (city) => {
        if (!window.confirm(`Remover ${city.cid_nome} desta região?`)) {
            return;
        }

        try {
            const response = await fetch(
                `https://salesmasters.softham.com.br/api/v2/regions/${data.reg_codigo}/cities/${city.cid_codigo}`,
                { method: 'DELETE' }
            );

            const result = await response.json();

            if (result.success) {
                toast.success(result.message);
                fetchRegionCities();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            console.error('Erro ao remover cidade:', error);
            toast.error('Erro ao remover cidade');
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        if (!formData.reg_descricao?.trim()) {
            toast.error('Descrição é obrigatória');
            return;
        }
        onSave(formData);
    };

    const [activeTab, setActiveTab] = useState('dados');

    return (
        <FormCadPadraoV2
            title={data ? `Região: ${data.reg_descricao || ''}` : "Nova Região"}
            onSave={handleSave}
            onCancel={onClose}
        >
            <div className="flex flex-col h-full">
                {/* Tabs */}
                <div className="flex px-6 border-b">
                    <button
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'dados' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('dados')}
                    >
                        <div className="flex items-center gap-2">
                            <FileText size={16} />
                            Dados Principais
                        </div>
                    </button>
                    {data && (
                        <button
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'cidades' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setActiveTab('cidades')}
                        >
                            <div className="flex items-center gap-2">
                                <MapPin size={16} />
                                Cidades
                            </div>
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="p-4 flex-1 overflow-auto">
                    {activeTab === 'dados' && (
                        <div className="form-grid">
                            <div className="col-12">
                                <InputField
                                    label="Descrição"
                                    value={formData.reg_descricao}
                                    onChange={(e) => handleChange('reg_descricao', e.target.value)}
                                    placeholder=""
                                    autoFocus
                                    large
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'cidades' && (
                        <div className="space-y-4">
                            {/* Combobox + Botão Adicionar */}
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Label className="text-xs mb-1 font-semibold">Adicionar Cidade</Label>
                                    <DbComboBox
                                        placeholder="Digite para buscar cidade..."
                                        value={selectedCity}
                                        onChange={(item) => setSelectedCity(item)}
                                        fetchData={async (search = '', limit = 20) => {
                                            const res = await fetch(`https://salesmasters.softham.com.br/api/v2/cities?search=${encodeURIComponent(search)}&limit=${limit}`);
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
                                <div className="flex items-end">
                                    <Button onClick={handleAddCity} size="sm" className="h-9">
                                        <Plus size={16} className="mr-1" />
                                        Adicionar
                                    </Button>
                                </div>
                            </div>

                            {/* Grid de Cidades */}
                            <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                                {loading ? (
                                    <div className="p-6 text-center text-sm text-gray-500">Carregando cidades...</div>
                                ) : regionCities.length === 0 ? (
                                    <div className="p-8 text-center text-sm text-gray-500 flex flex-col items-center gap-2">
                                        <MapPin size={24} className="text-gray-300" />
                                        Nenhuma cidade associada a esta região
                                    </div>
                                ) : (
                                    <div className="max-h-[300px] overflow-y-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b sticky top-0">
                                                <tr>
                                                    <th className="text-left p-3 text-xs font-semibold text-gray-600">Cidade</th>
                                                    <th className="text-center p-3 text-xs font-semibold text-gray-600 w-20">UF</th>
                                                    <th className="text-center p-3 text-xs font-semibold text-gray-600 w-20">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {regionCities.map((city) => (
                                                    <tr key={city.cid_codigo} className="border-b hover:bg-gray-50/50 transition-colors">
                                                        <td className="p-2 px-3 text-sm text-gray-700">{city.cid_nome}</td>
                                                        <td className="p-2 px-3 text-sm text-center text-gray-500">{city.cid_uf}</td>
                                                        <td className="p-2 px-3 text-center">
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                                                onClick={() => handleRemoveCity(city)}
                                                                title="Remover"
                                                            >
                                                                <Trash2 size={14} />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </FormCadPadraoV2>
    );
};

export default RegionForm;
