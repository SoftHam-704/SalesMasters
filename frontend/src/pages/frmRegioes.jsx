import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, RefreshCw, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RegionForm from '../components/forms/RegionForm';
import { toast } from "sonner";

const FrmRegioes = () => {
    const [regions, setRegions] = useState([]);
    const [filteredRegions, setFilteredRegions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [selectedRegion, setSelectedRegion] = useState(null);

    const fetchRegions = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3005/api/v2/regions');
            const data = await response.json();
            if (data.success) {
                setRegions(data.data);
                setFilteredRegions(data.data);
            }
        } catch (error) {
            console.error('Erro ao carregar regiões:', error);
            toast.error('Erro ao carregar regiões');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRegions();
    }, []);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredRegions(regions);
        } else {
            const filtered = regions.filter(region =>
                region.reg_descricao?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredRegions(filtered);
        }
    }, [searchTerm, regions]);

    const handleNew = () => {
        setSelectedRegion(null);
        setShowForm(true);
    };

    const handleEdit = (region) => {
        setSelectedRegion(region);
        setShowForm(true);
    };

    const handleDelete = async (region) => {
        if (!window.confirm(`Deseja realmente excluir a região "${region.reg_descricao}"?`)) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3005/api/v2/regions/${region.reg_codigo}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Região excluída com sucesso!');
                fetchRegions();
            } else {
                toast.error(data.message || 'Erro ao excluir região');
            }
        } catch (error) {
            console.error('Erro ao excluir região:', error);
            toast.error('Erro ao excluir região');
        }
    };

    const handleSave = async (formData) => {
        try {
            const url = selectedRegion
                ? `http://localhost:3005/api/v2/regions/${selectedRegion.reg_codigo}`
                : 'http://localhost:3005/api/v2/regions';

            const method = selectedRegion ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message || 'Região salva com sucesso!');
                setShowForm(false);
                fetchRegions();
            } else {
                toast.error(data.message || 'Erro ao salvar região');
            }
        } catch (error) {
            console.error('Erro ao salvar região:', error);
            toast.error('Erro ao salvar região');
        }
    };

    if (showForm) {
        return (
            <RegionForm
                data={selectedRegion}
                onClose={() => setShowForm(false)}
                onSave={handleSave}
            />
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4">
                <h1 className="text-2xl font-bold text-gray-800">Cadastro de Regiões</h1>
            </div>

            {/* Toolbar */}
            <div className="bg-white border-b px-6 py-3 flex items-center gap-3">
                <Input
                    placeholder="pesquisar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-xs h-9 text-sm"
                />
                <Button
                    onClick={handleNew}
                    size="sm"
                    className="h-9 text-sm"
                >
                    <Plus size={16} className="mr-2" />
                    Novo
                </Button>
                <Button
                    onClick={fetchRegions}
                    size="sm"
                    variant="outline"
                    className="h-9 text-sm"
                >
                    <RefreshCw size={16} className="mr-2" />
                    Atualizar
                </Button>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-auto px-6 py-4">
                {loading ? (
                    <div className="text-center py-8 text-gray-500">Carregando...</div>
                ) : filteredRegions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        {searchTerm ? 'Nenhuma região encontrada' : 'Nenhuma região cadastrada'}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg border overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-100 border-b">
                                <tr>
                                    <th className="text-left p-3 text-sm font-semibold text-gray-700 w-24">Código</th>
                                    <th className="text-left p-3 text-sm font-semibold text-gray-700">Descrição</th>
                                    <th className="text-center p-3 text-sm font-semibold text-gray-700 w-24">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRegions.map((region) => (
                                    <tr
                                        key={region.reg_codigo}
                                        className="border-b hover:bg-gray-50 cursor-pointer"
                                        onDoubleClick={() => handleEdit(region)}
                                    >
                                        <td className="p-3 text-sm text-gray-600">{region.reg_codigo}</td>
                                        <td className="p-3 text-sm font-semibold text-orange-600">{region.reg_descricao}</td>
                                        <td className="p-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6"
                                                    onClick={() => handleEdit(region)}
                                                    title="Editar"
                                                >
                                                    <Pencil size={16} className="text-blue-600" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6"
                                                    onClick={() => handleDelete(region)}
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={16} className="text-red-600" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FrmRegioes;
