import React, { useState, useEffect } from 'react';
import { MapPin, RefreshCw, Building2, Palette } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GridCadPadraoV2 from '../components/GridCadPadraoV2';
import SectorForm from '../components/forms/SectorForm';
import { NODE_API_URL, getApiUrl } from '../utils/apiConfig';
import { toast } from "sonner";
import DbComboBox from '../components/DbComboBox';
import { Label } from "@/components/ui/label";

const FrmSetores = () => {
    const [sectors, setSectors] = useState([]);
    const [filteredSectors, setFilteredSectors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [selectedSector, setSelectedSector] = useState(null);
    const [selectedCity, setSelectedCity] = useState(null);

    const fetchSectors = async (cityId = null) => {
        setLoading(true);
        try {
            let url = getApiUrl(NODE_API_URL, '/api/v2/sectors');
            if (cityId) {
                url += `?city_id=${cityId}`;
            }
            const response = await fetch(url);
            const data = await response.json();
            if (data.success) {
                setSectors(data.data);
                setFilteredSectors(data.data);
            }
        } catch (error) {
            console.error('Erro ao carregar setores:', error);
            toast.error('Erro ao carregar setores');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSectors();
    }, []);

    useEffect(() => {
        if (selectedCity) {
            fetchSectors(selectedCity.cid_codigo);
        } else {
            fetchSectors();
        }
    }, [selectedCity]);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredSectors(sectors);
        } else {
            const filtered = sectors.filter(sector =>
                sector.set_descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                sector.cid_nome?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredSectors(filtered);
        }
    }, [searchTerm, sectors]);

    const handleNew = () => {
        setSelectedSector(null);
        setShowForm(true);
    };

    const handleEdit = (sector) => {
        setSelectedSector(sector);
        setShowForm(true);
    };

    const handleDelete = async (sector) => {
        if (!window.confirm(`Deseja realmente excluir o setor "${sector.set_descricao}"?`)) {
            return;
        }

        try {
            const url = getApiUrl(NODE_API_URL, `/api/v2/sectors/${sector.set_codigo}`);
            const response = await fetch(url, { method: 'DELETE' });
            const data = await response.json();

            if (data.success) {
                toast.success('Setor excluído com sucesso!');
                fetchSectors(selectedCity?.cid_codigo);
            } else {
                toast.error(data.message || 'Erro ao excluir setor');
            }
        } catch (error) {
            console.error('Erro ao excluir setor:', error);
            toast.error('Erro ao excluir setor');
        }
    };

    const handleSave = async (formData) => {
        try {
            const url = selectedSector
                ? getApiUrl(NODE_API_URL, `/api/v2/sectors/${selectedSector.set_codigo}`)
                : getApiUrl(NODE_API_URL, '/api/v2/sectors');

            const method = selectedSector ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message || 'Setor salvo com sucesso!');
                setShowForm(false);
                fetchSectors(selectedCity?.cid_codigo);
            } else {
                toast.error(data.message || 'Erro ao salvar setor');
            }
        } catch (error) {
            console.error('Erro ao salvar setor:', error);
            toast.error('Erro ao salvar setor');
        }
    };

    if (showForm) {
        return (
            <SectorForm
                data={selectedSector}
                defaultCityId={selectedCity?.cid_codigo}
                onClose={() => setShowForm(false)}
                onSave={handleSave}
            />
        );
    }

    // Custom render for grid items
    const renderSectorCard = (sector) => (
        <div className="flex items-center gap-3">
            <div
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: sector.set_cor || '#3B82F6' }}
                title={`Cor: ${sector.set_cor}`}
            />
            <div>
                <div className="font-medium text-gray-900">{sector.set_descricao}</div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Building2 size={12} />
                    {sector.cid_nome} - {sector.cid_uf}
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Toolbar */}
            <div className="bg-white border-b px-6 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-4 flex-1">
                    {/* Filtro por Cidade */}
                    <div className="w-64">
                        <Label className="text-xs mb-1 font-semibold text-gray-600">Filtrar por Cidade</Label>
                        <DbComboBox
                            placeholder="Todas as cidades..."
                            value={selectedCity}
                            onChange={(item) => setSelectedCity(item)}
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

                    {/* Busca */}
                    <div className="flex-1 max-w-md">
                        <Label className="text-xs mb-1 font-semibold text-gray-600">Buscar</Label>
                        <Input
                            placeholder="Pesquisar setores..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-9 text-sm"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 pt-5">
                    {selectedCity && (
                        <Button
                            onClick={() => setSelectedCity(null)}
                            size="sm"
                            variant="ghost"
                            className="h-9 text-sm text-gray-500"
                        >
                            Limpar Filtro
                        </Button>
                    )}
                    <Button
                        onClick={() => fetchSectors(selectedCity?.cid_codigo)}
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
                    title="Setores"
                    subtitle={selectedCity
                        ? `Setores de ${selectedCity.cid_nome} - ${selectedCity.cid_uf}`
                        : "Todos os setores cadastrados"
                    }
                    icon={MapPin}
                    data={filteredSectors}
                    titleKey="set_descricao"
                    subtitleKey="cid_nome"
                    onNew={handleNew}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    renderItem={renderSectorCard}
                    emptyMessage="Nenhum setor cadastrado. Clique em + para adicionar."
                />
            </div>
        </div>
    );
};

export default FrmSetores;
