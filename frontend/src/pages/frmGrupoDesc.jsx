import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, RefreshCw, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DiscountGroupForm from '../components/forms/DiscountGroupForm';
import { toast } from "sonner";

const FrmGrupoDesc = () => {
    const [groups, setGroups] = useState([]);
    const [filteredGroups, setFilteredGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);

    // Fetch groups from API
    const fetchGroups = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3005/api/v2/discount-groups');
            const data = await response.json();
            if (data.success) {
                setGroups(data.data);
                setFilteredGroups(data.data);
            }
        } catch (error) {
            console.error('Erro ao carregar grupos de descontos:', error);
            toast.error('Erro ao carregar grupos de descontos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    // Filter groups based on search term
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredGroups(groups);
        } else {
            const filtered = groups.filter(group =>
                group.gid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                group.gde_nome?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredGroups(filtered);
        }
    }, [searchTerm, groups]);

    const handleNew = () => {
        setSelectedGroup(null);
        setShowForm(true);
    };

    const handleEdit = (group) => {
        setSelectedGroup(group);
        setShowForm(true);
    };

    const handleDelete = async (group) => {
        if (!window.confirm(`Deseja realmente excluir o grupo "${group.gid}"?`)) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3005/api/v2/discount-groups/${group.gde_id}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Grupo de desconto excluído com sucesso!');
                fetchGroups();
            } else {
                toast.error(data.message || 'Erro ao excluir grupo');
            }
        } catch (error) {
            console.error('Erro ao excluir grupo:', error);
            toast.error('Erro ao excluir grupo');
        }
    };

    const handleSave = async (formData) => {
        try {
            const url = selectedGroup
                ? `http://localhost:3005/api/v2/discount-groups/${selectedGroup.gde_id}`
                : 'http://localhost:3005/api/v2/discount-groups';

            const method = selectedGroup ? 'PUT' : 'POST';

            // Ensure manual ID logic if required by backend or passed from form
            // The form passes 'gid'
            const body = {
                ...formData
            };

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message || 'Grupo salvo com sucesso!');
                setShowForm(false);
                fetchGroups();
            } else {
                toast.error(data.message || 'Erro ao salvar grupo');
            }
        } catch (error) {
            console.error('Erro ao salvar grupo:', error);
            toast.error('Erro ao salvar grupo');
        }
    };

    if (showForm) {
        return (
            <DiscountGroupForm
                data={selectedGroup}
                onClose={() => setShowForm(false)}
                onSave={handleSave}
            />
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4">
                <h1 className="text-2xl font-bold text-gray-800">Cadastro de Grupos de Desconto</h1>
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
                    onClick={fetchGroups}
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
                ) : filteredGroups.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        {searchTerm ? 'Nenhum grupo encontrado' : 'Nenhum grupo cadastrado'}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg border overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-100 border-b">
                                <tr>
                                    <th className="text-center p-2 text-sm font-semibold text-gray-700 w-16 border-r">ID</th>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                        <th key={num} className="text-center p-2 text-sm font-semibold text-gray-700 border-r w-20">
                                            {num}º
                                        </th>
                                    ))}
                                    <th className="text-center p-2 text-sm font-semibold text-gray-700 w-24">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredGroups.map((group) => (
                                    <tr
                                        key={group.gde_id}
                                        className="border-b hover:bg-gray-50 cursor-pointer"
                                        onDoubleClick={() => handleEdit(group)}
                                    >
                                        <td className="p-2 text-sm text-center text-gray-600 border-r">
                                            {group.gde_id}
                                        </td>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                            <td key={num} className="p-2 text-sm text-center border-r">
                                                {group[`gde_desc${num}`] ? `${group[`gde_desc${num}`].toFixed(2)}%` : '0.00%'}
                                            </td>
                                        ))}
                                        <td className="p-2 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6"
                                                    onClick={() => handleEdit(group)}
                                                    title="Editar"
                                                >
                                                    <Pencil size={16} className="text-blue-600" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6"
                                                    onClick={() => handleDelete(group)}
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

export default FrmGrupoDesc;
