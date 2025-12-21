import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, RefreshCw, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ActivityAreaForm from '../components/forms/ActivityAreaForm';
import { toast } from "sonner";

const FrmAreaAtuacao = () => {
    const [areas, setAreas] = useState([]);
    const [filteredAreas, setFilteredAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [selectedArea, setSelectedArea] = useState(null);

    const fetchAreas = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3005/api/v2/activity-areas');
            const data = await response.json();
            if (data.success) {
                setAreas(data.data);
                setFilteredAreas(data.data);
            }
        } catch (error) {
            console.error('Erro ao carregar áreas de atuação:', error);
            toast.error('Erro ao carregar áreas de atuação');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAreas();
    }, []);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredAreas(areas);
        } else {
            const filtered = areas.filter(area =>
                area.atu_descricao?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredAreas(filtered);
        }
    }, [searchTerm, areas]);

    const handleNew = () => {
        setSelectedArea(null);
        setShowForm(true);
    };

    const handleEdit = (area) => {
        setSelectedArea(area);
        setShowForm(true);
    };

    const handleDelete = async (area) => {
        if (!window.confirm(`Deseja realmente excluir a área "${area.atu_descricao}"?`)) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3005/api/v2/activity-areas/${area.atu_id}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Área de atuação excluída com sucesso!');
                fetchAreas();
            } else {
                toast.error(data.message || 'Erro ao excluir área');
            }
        } catch (error) {
            console.error('Erro ao excluir área:', error);
            toast.error('Erro ao excluir área');
        }
    };

    const handleSave = async (formData) => {
        try {
            const url = selectedArea
                ? `http://localhost:3005/api/v2/activity-areas/${selectedArea.atu_id}`
                : 'http://localhost:3005/api/v2/activity-areas';

            const method = selectedArea ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message || 'Área de atuação salva com sucesso!');
                setShowForm(false);
                fetchAreas();
            } else {
                toast.error(data.message || 'Erro ao salvar área');
            }
        } catch (error) {
            console.error('Erro ao salvar área:', error);
            toast.error('Erro ao salvar área');
        }
    };

    if (showForm) {
        return (
            <ActivityAreaForm
                data={selectedArea}
                onClose={() => setShowForm(false)}
                onSave={handleSave}
            />
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4">
                <h1 className="text-2xl font-bold text-gray-800">Cadastro de Áreas de Atuação</h1>
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
                    onClick={fetchAreas}
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
                ) : filteredAreas.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        {searchTerm ? 'Nenhuma área encontrada' : 'Nenhuma área cadastrada'}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg border overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-100 border-b">
                                <tr>
                                    <th className="text-left p-3 text-sm font-semibold text-gray-700 w-24">ID</th>
                                    <th className="text-left p-3 text-sm font-semibold text-gray-700">Descrição</th>
                                    <th className="text-center p-3 text-sm font-semibold text-gray-700 w-24">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAreas.map((area) => (
                                    <tr
                                        key={area.atu_id}
                                        className="border-b hover:bg-gray-50 cursor-pointer"
                                        onDoubleClick={() => handleEdit(area)}
                                    >
                                        <td className="p-3 text-sm text-gray-600">{area.atu_id}</td>
                                        <td className="p-3 text-sm font-semibold text-orange-600">{area.atu_descricao}</td>
                                        <td className="p-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6"
                                                    onClick={() => handleEdit(area)}
                                                    title="Editar"
                                                >
                                                    <Pencil size={16} className="text-blue-600" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6"
                                                    onClick={() => handleDelete(area)}
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

export default FrmAreaAtuacao;
