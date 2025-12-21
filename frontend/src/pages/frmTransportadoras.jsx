import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, RefreshCw, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CarrierForm from '../components/forms/CarrierForm';
import { toast } from "sonner";

const FrmTransportadoras = () => {
    const [carriers, setCarriers] = useState([]);
    const [filteredCarriers, setFilteredCarriers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [selectedCarrier, setSelectedCarrier] = useState(null);

    const fetchCarriers = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3005/api/v2/carriers');
            const data = await response.json();
            if (data.success) {
                setCarriers(data.data);
                setFilteredCarriers(data.data);
            }
        } catch (error) {
            console.error('Erro ao carregar transportadoras:', error);
            toast.error('Erro ao carregar transportadoras');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCarriers();
    }, []);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredCarriers(carriers);
        } else {
            const filtered = carriers.filter(carrier =>
                carrier.tra_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                carrier.tra_cnpj?.includes(searchTerm) ||
                carrier.tra_cidade?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredCarriers(filtered);
        }
    }, [searchTerm, carriers]);

    const handleNew = () => {
        setSelectedCarrier(null);
        setShowForm(true);
    };

    const handleEdit = (carrier) => {
        setSelectedCarrier(carrier);
        setShowForm(true);
    };

    const handleDelete = async (carrier) => {
        if (!window.confirm(`Deseja realmente excluir a transportadora "${carrier.tra_nome}"?`)) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3005/api/v2/carriers/${carrier.tra_codigo}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Transportadora excluída com sucesso!');
                fetchCarriers();
            } else {
                toast.error(data.message || 'Erro ao excluir transportadora');
            }
        } catch (error) {
            console.error('Erro ao excluir transportadora:', error);
            toast.error('Erro ao excluir transportadora');
        }
    };

    const handleSave = async (formData) => {
        try {
            const url = selectedCarrier
                ? `http://localhost:3005/api/v2/carriers/${selectedCarrier.tra_codigo}`
                : 'http://localhost:3005/api/v2/carriers';

            const method = selectedCarrier ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message || 'Transportadora salva com sucesso!');
                setShowForm(false);
                fetchCarriers();
            } else {
                toast.error(data.message || 'Erro ao salvar transportadora');
            }
        } catch (error) {
            console.error('Erro ao salvar transportadora:', error);
            toast.error('Erro ao salvar transportadora');
        }
    };

    if (showForm) {
        return (
            <CarrierForm
                data={selectedCarrier}
                onClose={() => setShowForm(false)}
                onSave={handleSave}
            />
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4">
                <h1 className="text-2xl font-bold text-gray-800">Cadastro de Transportadoras</h1>
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
                    onClick={fetchCarriers}
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
                ) : filteredCarriers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        {searchTerm ? 'Nenhuma transportadora encontrada' : 'Nenhuma transportadora cadastrada'}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg border overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-100 border-b">
                                <tr>
                                    <th className="text-left p-3 text-sm font-semibold text-gray-700 w-24">ID</th>
                                    <th className="text-left p-3 text-sm font-semibold text-gray-700">Nome</th>
                                    <th className="text-left p-3 text-sm font-semibold text-gray-700 w-40">Telefone</th>
                                    <th className="text-left p-3 text-sm font-semibold text-gray-700 w-48">Cidade</th>
                                    <th className="text-center p-3 text-sm font-semibold text-gray-700 w-24">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCarriers.map((carrier) => (
                                    <tr
                                        key={carrier.tra_codigo}
                                        className="border-b hover:bg-gray-50 cursor-pointer"
                                        onDoubleClick={() => handleEdit(carrier)}
                                    >
                                        <td className="p-3 text-sm text-gray-600">{carrier.tra_codigo}</td>
                                        <td className="p-3 text-sm font-semibold text-orange-600">{carrier.tra_nome}</td>
                                        <td className="p-3 text-sm text-gray-600">{carrier.tra_fone}</td>
                                        <td className="p-3 text-sm text-gray-600">{carrier.tra_cidade}</td>
                                        <td className="p-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6"
                                                    onClick={() => handleEdit(carrier)}
                                                    title="Editar"
                                                >
                                                    <Pencil size={16} className="text-blue-600" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6"
                                                    onClick={() => handleDelete(carrier)}
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

export default FrmTransportadoras;
