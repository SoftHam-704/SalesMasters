import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GridCadPadraoV2 from '../components/GridCadPadraoV2';
import CampaignForm from '../components/forms/CampaignForm';
import { NODE_API_URL, getApiUrl } from '../utils/apiConfig';
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

const FrmCampanhas = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [filteredCampaigns, setFilteredCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState(null);

    const fetchCampaigns = async () => {
        setLoading(true);
        try {
            const url = getApiUrl(NODE_API_URL, '/api/v2/campaigns');
            const response = await fetch(url);
            const data = await response.json();
            if (data.success) {
                setCampaigns(data.data);
                setFilteredCampaigns(data.data);
            }
        } catch (error) {
            console.error('Erro ao carregar campanhas:', error);
            toast.error('Erro ao carregar campanhas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredCampaigns(campaigns);
        } else {
            const lower = searchTerm.toLowerCase();
            const filtered = campaigns.filter(item =>
                item.cmp_descricao?.toLowerCase().includes(lower) ||
                item.cli_fantasia?.toLowerCase().includes(lower) ||
                item.industria_nome?.toLowerCase().includes(lower)
            );
            setFilteredCampaigns(filtered);
        }
    }, [searchTerm, campaigns]);

    const handleNew = () => {
        setSelectedCampaign(null);
        setShowForm(true);
    };

    const handleEdit = (campaign) => {
        // Edit flow not fully implemented in form yet (focus on creating new agreements)
        // But we can open it to view details
        setSelectedCampaign(campaign);
        setShowForm(true);
    };

    const handleDelete = async (campaign) => {
        if (!window.confirm(`Deseja cancelar a campanha "${campaign.cmp_descricao}"?`)) {
            return;
        }
        // TODO: Implement delete/cancel endpoint if needed. Maybe just update status to CANCELLED.
        toast.info("Função de cancelamento em desenvolvimento.");
    };

    const handleSave = async (formData) => {
        try {
            const url = getApiUrl(NODE_API_URL, '/api/v2/campaigns');
            const method = 'POST'; // Always POST for now (new version)

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message || 'Campanha criada com sucesso!');
                setShowForm(false);
                fetchCampaigns();
            } else {
                toast.error(data.message || 'Erro ao salvar campanha');
            }
        } catch (error) {
            console.error('Erro ao salvar:', error);
            toast.error('Erro ao salvar campanha');
        }
    };

    if (showForm) {
        return (
            <CampaignForm
                data={selectedCampaign}
                onClose={() => setShowForm(false)}
                onSave={handleSave}
            />
        );
    }

    const renderCard = (item) => (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between items-start">
                <div className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    {item.cmp_descricao}
                </div>
                {item.cmp_status === 'ACTIVE' || !item.cmp_status ? (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border border-emerald-200">Em Andamento</span>
                ) : (
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold uppercase">{item.cmp_status}</span>
                )}
            </div>

            <div className="text-sm text-gray-600 font-medium">
                {item.cli_fantasia} <span className="text-gray-400 mx-1">|</span> {item.industria_nome}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Meta Diária (R$)</span>
                    <span className="text-sm font-bold text-emerald-600">
                        {parseFloat(item.cmp_meta_diaria_val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                </div>
                <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Meta Diária (Qtd)</span>
                    <span className="text-sm font-bold text-blue-600">
                        {parseFloat(item.cmp_meta_diaria_qtd).toFixed(2)} un
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1 text-[10px] text-gray-500 bg-white border px-2 py-1 rounded">
                    <Calendar size={10} />
                    {new Date(item.cmp_campanha_ini).toLocaleDateString()} a {new Date(item.cmp_campanha_fim).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-purple-600 bg-purple-50 px-2 py-1 rounded font-bold">
                    <TrendingUp size={10} />
                    Crescimento: +{item.cmp_perc_crescimento}%
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-screen flex flex-col bg-gray-50 w-full">
            {/* Toolbar */}
            <div className="bg-white border-b px-6 py-4 flex items-center justify-between gap-3 shadow-sm z-10">
                <div className="flex-1 max-w-md">
                    <Label className="text-xs mb-1 font-semibold text-gray-600">Buscar Campanhas</Label>
                    <Input
                        placeholder="Pesquisar por nome, cliente ou indústria..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-9 text-sm"
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-auto bg-gray-50/50 p-6 w-full">
                <GridCadPadraoV2
                    title="Campanhas Promocionais"
                    subtitle="Gerencie acordos de crescimento e metas individuais"
                    icon={Target}
                    data={filteredCampaigns}
                    titleKey="cmp_descricao"
                    onNew={handleNew}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    renderItem={renderCard}
                    emptyMessage="Nenhuma campanha ativa. Clique em + para criar uma nova estratégia."
                />
            </div>
        </div>
    );
};

export default FrmCampanhas;
