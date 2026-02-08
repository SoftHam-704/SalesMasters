import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Calendar, AlertCircle, Users, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GridCadPadraoV2 from '../components/GridCadPadraoV2';
import CampaignForm from '../components/forms/CampaignForm';
import { NODE_API_URL, getApiUrl } from '../utils/apiConfig';
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { HelpCircle, Sparkles } from 'lucide-react';
import CampaignHelpModal from '@/components/crm/CampaignHelpModal';

const FrmCampanhas = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [filteredCampaigns, setFilteredCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [helpOpen, setHelpOpen] = useState(false);

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
            const url = selectedCampaign
                ? getApiUrl(NODE_API_URL, `/api/v2/campaigns/${selectedCampaign.cmp_codigo}`)
                : getApiUrl(NODE_API_URL, '/api/v2/campaigns');

            const method = selectedCampaign ? 'PUT' : 'POST';

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

    const renderCampaignCard = (item) => (
        <div
            key={item.cmp_codigo}
            className="group relative bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-300 overflow-hidden flex flex-col"
        >
            {/* Card Header with Status Accent */}
            <div className={`h-2 w-full ${item.cmp_status === 'ATIVA' ? 'bg-emerald-500' :
                item.cmp_status === 'CONCLUIDA' ? 'bg-blue-500' :
                    item.cmp_status === 'SIMULACAO' ? 'bg-amber-500' : 'bg-slate-300'
                }`} />

            <div className="p-6 flex-1 flex flex-col gap-4">
                <div className="flex justify-between items-start gap-4">
                    <div className="bg-slate-100 w-12 h-12 rounded-2xl flex items-center justify-center text-slate-500 font-black text-xl flex-shrink-0 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                        {item.cmp_descricao.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-black text-slate-800 text-lg leading-tight truncate uppercase tracking-tight">
                            {item.cmp_descricao}
                        </h3>
                        <p className="text-xs font-bold text-slate-400 uppercase truncate mt-0.5">
                            {item.cli_nomred || item.cli_fantasia}
                        </p>
                    </div>
                    <button
                        onClick={() => handleDelete(item)}
                        className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                    >
                        <AlertCircle size={18} />
                    </button>
                </div>

                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase">
                        <Sparkles size={12} className="text-amber-500" />
                        <span>Fornecedor: {item.industria_nome}</span>
                    </div>
                    {item.cmp_tema && (
                        <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-100 text-[10px] font-black uppercase tracking-wider mt-1">
                            MOTE: {item.cmp_tema}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <span className="text-[9px] text-slate-400 font-black uppercase block mb-1">Meta Diária</span>
                        <span className="text-sm font-black text-slate-800">
                            {parseFloat(item.cmp_meta_diaria_val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <span className="text-[9px] text-slate-400 font-black uppercase block mb-1">Verba Solicitada</span>
                        <span className="text-sm font-black text-slate-800">
                            {parseFloat(item.cmp_verba_solicitada || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                    <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 font-black uppercase">Progresso</span>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-1000 ${(item.cmp_real_valor_total / item.cmp_meta_valor_total) >= 1 ? 'bg-emerald-500' : 'bg-amber-500'
                                        }`}
                                    style={{ width: `${Math.min(100, (item.cmp_real_valor_total / item.cmp_meta_valor_total) * 100 || 0)}%` }}
                                />
                            </div>
                            <span className="text-[10px] font-black text-slate-600">
                                {Math.min(100, (item.cmp_real_valor_total / item.cmp_meta_valor_total) * 100 || 0).toFixed(0)}%
                            </span>
                        </div>
                    </div>
                    <Button
                        onClick={() => handleEdit(item)}
                        variant="ghost"
                        className="h-9 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 gap-2"
                    >
                        GERENCIAR
                    </Button>
                </div>
            </div>

            {/* Status Batch Floating */}
            <div className="absolute top-4 right-4">
                <span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest shadow-sm ${item.cmp_status === 'ATIVA' ? 'bg-emerald-500 text-white' :
                    item.cmp_status === 'CONCLUIDA' ? 'bg-blue-500 text-white' :
                        item.cmp_status === 'SIMULACAO' ? 'bg-amber-500 text-white' :
                            'bg-slate-400 text-white'
                    }`}>
                    {item.cmp_status || 'SIMULAÇÃO'}
                </span>
            </div>
        </div>
    );

    return (
        <div className="h-screen flex flex-col bg-slate-50 w-full overflow-hidden">
            {/* Toolbar / Header */}
            <div className="bg-white border-b px-8 py-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-sm z-10 shrink-0">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <div className="bg-emerald-500 p-2 rounded-xl text-white">
                            <Target size={24} />
                        </div>
                        CAMPANHAS PROMOCIONAIS
                    </h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Gerencie acordos de crescimento e metas individuais
                    </p>
                </div>

                <div className="flex items-center gap-4 flex-1 max-w-2xl px-4">
                    <div className="relative flex-1 group">
                        <Input
                            placeholder="Pesquisar por cliente, indústria ou título..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-12 pl-4 pr-10 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-emerald-500 transition-all text-sm font-medium"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500">
                            <Users size={18} />
                        </div>
                    </div>

                    <Button
                        onClick={() => setHelpOpen(true)}
                        variant="ghost"
                        className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700"
                    >
                        <HelpCircle size={20} />
                    </Button>

                    <Button
                        onClick={handleNew}
                        className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-lg shadow-emerald-100 gap-2 flex-shrink-0"
                    >
                        <Plus size={20} /> <span className="hidden md:inline">NOVA ESTRATÉGIA</span>
                    </Button>
                </div>
            </div>

            {/* Quick Stats Summary */}
            <div className="px-8 pt-8 pb-4 grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
                <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase mb-1">Total de Campanhas</span>
                    <span className="text-2xl font-black text-slate-800 tracking-tighter">{campaigns.length}</span>
                </div>
                <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase mb-1">Campanhas Ativas</span>
                    <span className="text-2xl font-black text-emerald-600 tracking-tighter">
                        {campaigns.filter(c => c.cmp_status === 'ATIVA').length}
                    </span>
                </div>
                <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase mb-1">Em Planejamento</span>
                    <span className="text-2xl font-black text-amber-500 tracking-tighter">
                        {campaigns.filter(c => c.cmp_status === 'SIMULACAO').length}
                    </span>
                </div>
                <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase mb-1">Verba Comprometida</span>
                    <span className="text-xl font-black text-slate-800 tracking-tight">
                        R$ {campaigns.reduce((acc, curr) => acc + parseFloat(curr.cmp_verba_solicitada || 0), 0).toLocaleString()}
                    </span>
                </div>
            </div>

            {/* Content Area - Cards Grid */}
            <div className="flex-1 overflow-auto p-8 pt-4">
                {loading ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-50">
                        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="font-black text-slate-400 uppercase text-xs tracking-widest">Sincronizando Estratégias...</p>
                    </div>
                ) : filteredCampaigns.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-[48px] border-4 border-dashed border-slate-100">
                        <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center text-slate-200 mb-6">
                            <Target size={48} />
                        </div>
                        <h4 className="text-xl font-black text-slate-400 uppercase tracking-widest">Nenhuma Campanha no Radar</h4>
                        <p className="text-slate-400 max-w-sm mt-2 text-sm">Comece criando uma nova estratégia 1-a-1 clicando no botão de Nova Estratégia acima.</p>
                        <Button
                            onClick={handleNew}
                            className="mt-8 h-12 px-10 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-3xl"
                        >
                            CRIAR PRIMEIRA CAMPANHA
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-12">
                        {filteredCampaigns.map(renderCampaignCard)}
                    </div>
                )}
            </div>

            <CampaignHelpModal
                open={helpOpen}
                onClose={() => setHelpOpen(false)}
            />
        </div>
    );
};

export default FrmCampanhas;
