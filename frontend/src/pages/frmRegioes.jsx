import React, { useState, useEffect } from 'react';
import { MapPin, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RegionForm from '../components/forms/RegionForm';
import GridCadPadraoV2 from '../components/GridCadPadraoV2';
import { NODE_API_URL, getApiUrl } from '../utils/apiConfig';
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
            const url = getApiUrl(NODE_API_URL, '/api/v2/regions');
            const response = await fetch(url);
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
            const url = getApiUrl(NODE_API_URL, `/api/v2/regions/${region.reg_codigo}`);
            const response = await fetch(url, {
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
                ? getApiUrl(NODE_API_URL, `/api/v2/regions/${selectedRegion.reg_codigo}`)
                : getApiUrl(NODE_API_URL, '/api/v2/regions');

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
            {/* Toolbar - Search only */}
            <div className="bg-white border-b px-6 py-3 flex items-center justify-between gap-3">
                <div className="flex-1 max-w-lg">
                    <Input
                        placeholder="Pesquisar regiões..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-9 text-sm"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={fetchRegions}
                        size="sm"
                        variant="outline"
                        className="h-9 text-sm"
                        title="Atualizar lista"
                    >
                        <RefreshCw size={16} className="mr-2" />
                        Atualizar
                    </Button>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-auto bg-gray-50/50 p-6">
                <GridCadPadraoV2
                    title="Regiões"
                    subtitle="Cadastro de regiões e cidades atendidas"
                    icon={MapPin}
                    data={filteredRegions}
                    titleKey="reg_descricao"
                    onNew={handleNew}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </div>
        </div>
    );
};

export default FrmRegioes;
