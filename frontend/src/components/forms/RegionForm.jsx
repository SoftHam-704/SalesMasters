import React, { useState, useEffect } from 'react';
import { FileText, MapPin, Trash2, Plus } from 'lucide-react';
import FormCadPadrao from '../FormCadPadrao';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const RegionForm = ({ data, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        reg_descricao: ''
    });

    const [allCities, setAllCities] = useState([]);
    const [regionCities, setRegionCities] = useState([]);
    const [selectedCity, setSelectedCity] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (data) {
            setFormData({
                reg_descricao: data.reg_descricao || ''
            });
            fetchRegionCities();
        }
        fetchAllCities();
    }, [data]);

    const fetchAllCities = async () => {
        try {
            const response = await fetch('http://localhost:3005/api/v2/cities');
            const result = await response.json();
            if (result.success) {
                setAllCities(result.data);
            }
        } catch (error) {
            console.error('Erro ao carregar cidades:', error);
        }
    };

    const fetchRegionCities = async () => {
        if (!data?.reg_codigo) return;

        setLoading(true);
        try {
            const response = await fetch(`http://localhost:3005/api/v2/regions/${data.reg_codigo}/cities`);
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
            const response = await fetch(`http://localhost:3005/api/v2/regions/${data.reg_codigo}/cities`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cid_id: parseInt(selectedCity) })
            });

            const result = await response.json();

            if (result.success) {
                toast.success(result.message);
                setSelectedCity('');
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
                `http://localhost:3005/api/v2/regions/${data.reg_codigo}/cities/${city.cid_codigo}`,
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
            alert('Descrição é obrigatória');
            return;
        }
        onSave(formData);
    };

    const mainTabs = [
        { id: 'dados', label: 'Dados', icon: <FileText size={16} /> },
    ];

    const relatedTabs = data ? [
        { id: 'cidades', label: 'Cidades', icon: <MapPin size={16} /> }
    ] : [];

    const renderTabContent = (activeTab) => {
        if (activeTab === 'dados') {
            return (
                <div className="p-4">
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <Label className="text-xs font-semibold">Descrição</Label>
                            <Input
                                value={formData.reg_descricao}
                                onChange={(e) => handleChange('reg_descricao', e.target.value)}
                                className="h-8 text-sm bg-blue-50 border-blue-300 font-semibold"
                                placeholder="Digite a descrição da região"
                            />
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    const renderRelatedContent = (activeTab) => {
        if (activeTab === 'cidades') {
            return (
                <div className="p-4">
                    {/* Combobox + Botão Adicionar */}
                    <div className="flex gap-2 mb-4">
                        <div className="flex-1">
                            <Label className="text-xs mb-1">Adicionar Cidade</Label>
                            <Select value={selectedCity} onValueChange={setSelectedCity}>
                                <SelectTrigger className="h-8 text-sm">
                                    <SelectValue placeholder="Selecione uma cidade..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {allCities.map(city => (
                                        <SelectItem key={city.cid_codigo} value={city.cid_codigo.toString()}>
                                            {city.cid_nome} - {city.cid_uf}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end">
                            <Button onClick={handleAddCity} size="sm" className="h-8">
                                <Plus size={16} className="mr-1" />
                                Adicionar
                            </Button>
                        </div>
                    </div>

                    {/* Grid de Cidades */}
                    <div className="border rounded-lg overflow-hidden">
                        {loading ? (
                            <div className="p-4 text-center text-sm text-gray-500">Carregando...</div>
                        ) : regionCities.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">
                                Nenhuma cidade associada a esta região
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-100 border-b">
                                    <tr>
                                        <th className="text-left p-2 text-xs font-semibold text-gray-700">Cidade</th>
                                        <th className="text-center p-2 text-xs font-semibold text-gray-700 w-16">UF</th>
                                        <th className="text-center p-2 text-xs font-semibold text-gray-700 w-20">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {regionCities.map((city) => (
                                        <tr key={city.cid_codigo} className="border-b hover:bg-gray-50">
                                            <td className="p-2 text-sm">{city.cid_nome}</td>
                                            <td className="p-2 text-sm text-center">{city.cid_uf}</td>
                                            <td className="p-2 text-center">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6"
                                                    onClick={() => handleRemoveCity(city)}
                                                    title="Remover"
                                                >
                                                    <Trash2 size={14} className="text-red-600" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <FormCadPadrao
            title={data ? `Região: ${data.reg_descricao || ''}` : "Nova Região"}
            tabs={mainTabs}
            relatedTabs={relatedTabs}
            renderTabContent={renderTabContent}
            renderRelatedContent={renderRelatedContent}
            onSave={handleSave}
            onClose={onClose}
        />
    );
};

export default RegionForm;
