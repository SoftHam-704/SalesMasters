import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Kanban, Plus, Filter, Loader2, DollarSign, Users,
    TrendingUp, Building2, X, ChevronDown, HelpCircle
} from 'lucide-react';
import axios from '@/lib/axios';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import KanbanBoard from '@/components/crm/KanbanBoard';
import CrmHelpModal from '@/components/crm/CrmHelpModal';

const RepCrmPipeline = () => {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    const ven_codigo = user.ven_codigo;

    const [pipeline, setPipeline] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewOpp, setShowNewOpp] = useState(false);
    const [editingOpp, setEditingOpp] = useState(null);
    const [industries, setIndustries] = useState([]);
    const [filterIndustry, setFilterIndustry] = useState('');

    const [oppForm, setOppForm] = useState({
        titulo: '', cli_codigo: null, valor_estimado: '', for_codigo: '', telefone_contato: '', ven_codigo: ven_codigo || ''
    });
    const [sellers, setSellers] = useState([]);
    const [filterSeller, setFilterSeller] = useState(ven_codigo || '');
    const [showHelp, setShowHelp] = useState(false);

    // Helpers para máscara monetária
    const maskCurrency = (value) => {
        if (!value) return '';
        const cleanValue = value.toString().replace(/\D/g, '');
        return (parseFloat(cleanValue) / 100).toFixed(2);
    };

    const displayValue = (val) => {
        if (val === undefined || val === null || val === '') return '';
        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(val);
    };

    const [clientSearch, setClientSearch] = useState('');
    const [clientResults, setClientResults] = useState([]);
    const [saving, setSaving] = useState(false);

    const fetchPipeline = useCallback(async () => {
        const vCode = filterSeller || ven_codigo;
        if (!vCode) {
            console.warn('[Pipeline] ven_codigo missing in sessionStorage and no filter selected');
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const res = await axios.get('/crm/pipeline', { params: { ven_codigo: vCode } });
            if (res.data.success) {
                let data = res.data.data;
                if (filterIndustry) {
                    data = data.map(stage => ({
                        ...stage,
                        items: stage.items.filter(item =>
                            String(item.for_codigo) === filterIndustry
                        )
                    }));
                }
                setPipeline(data);
            }
        } catch (err) {
            console.error('Erro ao buscar pipeline:', err);
        } finally {
            setLoading(false);
        }
    }, [ven_codigo, filterIndustry, filterSeller]);

    useEffect(() => { fetchPipeline(); }, [fetchPipeline]);

    useEffect(() => {
        const fetchLookups = async () => {
            try {
                const [indRes, selRes] = await Promise.all([
                    axios.get('/suppliers?status=A'),
                    axios.get('/crm/vendedores')
                ]);
                
                if (indRes.data.success && Array.isArray(indRes.data.data)) {
                    setIndustries(indRes.data.data);
                } else if (Array.isArray(indRes.data)) {
                    setIndustries(indRes.data);
                }

                if (selRes.data.success) {
                    setSellers(selRes.data.data);
                }
            } catch (err) { console.error(err); }
        };
        fetchLookups();
    }, []);

    const fetchClients = async (search) => {
        if (!search || search.length < 2) return;
        try {
            const res = await axios.get('/clients', { params: { search, limit: 10 } });
            if (res.data.success) setClientResults(res.data.data || []);
        } catch (err) { console.error(err); }
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (!over || !active) return;

        const oppId = active.id.replace('opp-', '');
        let newStageId = null;

        if (over.id.startsWith('stage-')) {
            newStageId = over.id.replace('stage-', '');
        } else if (over.id.startsWith('opp-')) {
            // Drop over another card, find which stage that card belongs to
            for (const stage of pipeline) {
                if (stage.items.find(i => `opp-${i.oportunidade_id}` === over.id)) {
                    newStageId = String(stage.etapa_id);
                    break;
                }
            }
        }

        if (!newStageId) return;

        let currentStageId = null;
        for (const stage of pipeline) {
            if (stage.items.find(i => `opp-${i.oportunidade_id}` === active.id)) {
                currentStageId = stage.etapa_id;
                break;
            }
        }

        if (String(currentStageId) === String(newStageId)) return;

        // Optimistic update
        setPipeline(prev => {
            return prev.map(stage => {
                let items = stage.items.filter(i => i.oportunidade_id !== parseInt(oppId));
                if (String(stage.etapa_id) === String(newStageId)) {
                    const movedItem = prev.flatMap(s => s.items).find(i => i.oportunidade_id === parseInt(oppId));
                    if (movedItem) items = [...items, movedItem];
                }
                return { ...stage, items };
            });
        });

        try {
            await axios.put(`/crm/oportunidades/${oppId}/move`, { etapa_id: parseInt(newStageId) });
            toast.success('Oportunidade movida!');
        } catch (err) {
            toast.error('Erro ao mover oportunidade');
            fetchPipeline();
        }
    };

    const handleCardClick = (opp) => {
        setEditingOpp(opp);
        setOppForm({
            titulo: opp.titulo,
            cli_codigo: opp.cli_codigo,
            valor_estimado: opp.valor_estimado || '',
            for_codigo: opp.for_codigo || '',
            telefone_contato: opp.telefone_contato || '',
            ven_codigo: opp.ven_codigo || ven_codigo || ''
        });
        setClientSearch(opp.cli_nomred || '');
        setShowNewOpp(true);
    };

    const handleQuickAction = (action, opp) => {
        if (action === 'whatsapp' && opp.telefone_contato) {
            const phone = opp.telefone_contato.replace(/\D/g, '');
            window.open(`https://wa.me/55${phone}`, '_blank');
        }
    };

    const handleSaveOpp = async () => {
        if (!oppForm.titulo || !oppForm.cli_codigo) {
            toast.error('Título e cliente são obrigatórios');
            return;
        }
        setSaving(true);
        try {
            if (editingOpp) {
                await axios.put(`/crm/oportunidades/${editingOpp.oportunidade_id}`, {
                    ...oppForm,
                    ven_codigo,
                    etapa_id: editingOpp.etapa_id
                });
                toast.success('Oportunidade atualizada!');
            } else {
                await axios.post('/crm/oportunidades', {
                    ...oppForm,
                    ven_codigo: oppForm.ven_codigo || ven_codigo,
                    etapa_id: pipeline[0]?.etapa_id || 1
                });
                toast.success('Oportunidade criada!');
            }
            setShowNewOpp(false);
            setEditingOpp(null);
            setOppForm({ titulo: '', cli_codigo: null, valor_estimado: '', for_codigo: '', telefone_contato: '', ven_codigo: ven_codigo || '' });
            setClientSearch('');
            fetchPipeline();
        } catch (err) {
            toast.error('Erro ao salvar oportunidade');
        } finally {
            setSaving(false);
        }
    };

    // Stats
    const totalValue = pipeline.reduce((acc, stage) => acc + stage.items.reduce((sum, item) => sum + parseFloat(item.valor_estimado || 0), 0), 0);
    const totalOpps = pipeline.reduce((acc, stage) => acc + stage.items.length, 0);

    return (
        <div className="flex flex-col h-full bg-slate-50/30">
            {/* Header */}
            <div className="flex-shrink-0 p-8 pb-6">
                <div className="max-w-[1600px] mx-auto">
                    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                        <div className="relative">
                            <h1 className="text-3xl font-black text-slate-800 tracking-tighter flex items-center gap-4">
                                <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 transition-transform hover:scale-105">
                                    <Kanban className="text-slate-600" size={28} />
                                </div>
                                <div>
                                    <span className="block leading-none">Pipeline de Vendas</span>
                                    <span className="text-[11px] uppercase font-black tracking-[0.2em] text-slate-400 mt-1 block">Aura Management System</span>
                                </div>
                            </h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setShowHelp(true)}
                                className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-emerald-500 hover:border-emerald-200 transition-all shadow-sm group"
                            >
                                <HelpCircle size={22} className="group-hover:scale-110 transition-transform" />
                            </button>
                            
                            <div className="h-11 w-px bg-slate-200 mx-1 hidden sm:block" />

                            <select
                                value={filterSeller}
                                onChange={e => setFilterSeller(e.target.value)}
                                className="h-11 px-4 rounded-2xl border border-slate-200 text-sm font-bold bg-white focus:border-violet-400 outline-none shadow-sm min-w-[160px] cursor-pointer hover:border-slate-300 transition-colors"
                            >
                                <option value="">Todos Vendedores</option>
                                {sellers.map(s => (
                                    <option key={s.ven_codigo} value={s.ven_codigo}>{s.ven_nome}</option>
                                ))}
                            </select>
                            <select
                                value={filterIndustry}
                                onChange={e => setFilterIndustry(e.target.value)}
                                className="h-11 px-4 rounded-2xl border border-slate-200 text-sm font-bold bg-white focus:border-violet-400 outline-none shadow-sm min-w-[160px] cursor-pointer hover:border-slate-300 transition-colors"
                            >
                                <option value="">Todas Indústrias</option>
                                {industries.map(ind => (
                                    <option key={ind.for_codigo} value={ind.for_codigo}>{ind.for_nomered || ind.for_nome}</option>
                                ))}
                            </select>
                            <Button
                                className="rounded-2xl bg-emerald-500 hover:bg-emerald-600 font-black h-11 px-6 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 text-xs uppercase tracking-widest text-white border-none"
                                onClick={() => { setEditingOpp(null); setOppForm({ titulo: '', cli_codigo: null, valor_estimado: '', for_codigo: '', telefone_contato: '', ven_codigo: ven_codigo || '' }); setClientSearch(''); setShowNewOpp(true); }}
                            >
                                <Plus size={18} className="mr-2" /> Nova Oportunidade
                            </Button>
                        </div>
                    </header>

                    {/* Summary Strip */}
                    <div className="flex items-center gap-8 bg-white/60 backdrop-blur-md rounded-[2.5rem] border border-white p-5 shadow-[0_8px_32px_rgba(0,0,0,0.02)]">
                        <div className="flex items-center gap-4 pl-2">
                            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/40">
                                <TrendingUp size={20} className="text-white" />
                            </div>
                            <div>
                                <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Pipeline Total</div>
                                <div className="text-xl font-black text-slate-800 tracking-tighter">
                                    {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </div>
                            </div>
                        </div>
                        <div className="w-px h-10 bg-slate-200/60" />
                        <div>
                            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ativos</div>
                            <div className="text-xl font-black text-slate-800 tracking-tighter">{totalOpps} <span className="text-xs font-bold text-slate-400 lowercase italic ml-1">oportunidades</span></div>
                        </div>
                        
                        <div className="flex-1 overflow-x-auto custom-scrollbar-hide h-full flex items-center gap-8 px-4 no-scrollbar">
                            {pipeline.map(stage => (
                                <div key={stage.etapa_id} className="hidden lg:block whitespace-nowrap">
                                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-tight flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                        {stage.descricao || stage.titulo || stage.nome}
                                    </div>
                                    <div className="text-sm font-black text-slate-600 tracking-tight mt-0.5">
                                        {stage.items.reduce((sum, i) => sum + parseFloat(i.valor_estimado || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* New/Edit Opportunity */}
            {showNewOpp && (
                <div className="flex-shrink-0 px-6">
                    <div className="max-w-[1600px] mx-auto">
                        <div className="bg-white border border-violet-200 rounded-2xl p-5 shadow-sm space-y-4 mb-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-slate-800 text-sm">{editingOpp ? 'Editar Oportunidade' : 'Nova Oportunidade'}</h3>
                                <button onClick={() => { setShowNewOpp(false); setEditingOpp(null); }} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"><X size={18} /></button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Título *</label>
                                    <input value={oppForm.titulo} onChange={e => setOppForm(p => ({ ...p, titulo: e.target.value }))} className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium focus:border-violet-400 outline-none" />
                                </div>
                                <div className="relative">
                                    <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Cliente *</label>
                                    <input value={clientSearch} onChange={e => { setClientSearch(e.target.value); fetchClients(e.target.value); }} placeholder="Buscar..." className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium focus:border-violet-400 outline-none" />
                                    {clientResults.length > 0 && clientSearch.length >= 2 && (
                                        <div className="absolute z-50 mt-1 bg-white border rounded-xl shadow-xl max-h-40 overflow-y-auto w-full">
                                            {clientResults.map(c => (
                                                <button key={c.cli_codigo} onClick={() => { setOppForm(p => ({ ...p, cli_codigo: c.cli_codigo })); setClientSearch(c.cli_nomred || c.cli_nome); setClientResults([]); }} className="w-full px-3 py-2 text-left text-sm hover:bg-violet-50">
                                                    <span className="font-bold">{c.cli_nomred}</span> <span className="text-slate-400 text-xs">{c.cli_cidade}/{c.cli_uf}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Valor Estimado</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                                        <input 
                                            type="text" 
                                            value={displayValue(oppForm.valor_estimado)} 
                                            onChange={e => {
                                                const masked = maskCurrency(e.target.value);
                                                setOppForm(p => ({ ...p, valor_estimado: masked }));
                                            }} 
                                            className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 bg-white focus:border-violet-400 outline-none" 
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Indústria</label>
                                    <select value={oppForm.for_codigo} onChange={e => setOppForm(p => ({ ...p, for_codigo: e.target.value }))} className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:border-violet-400 outline-none">
                                        <option value="">Selecione...</option>
                                        {industries.map(ind => <option key={ind.for_codigo} value={ind.for_codigo}>{ind.for_nomered || ind.for_nome}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Vendedor *</label>
                                    <select value={oppForm.ven_codigo} onChange={e => setOppForm(p => ({ ...p, ven_codigo: e.target.value }))} className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:border-violet-400 outline-none">
                                        <option value="">Selecione...</option>
                                        {sellers.map(s => <option key={s.ven_codigo} value={s.ven_codigo}>{s.ven_nome}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">WhatsApp Contato</label>
                                    <input value={oppForm.telefone_contato} onChange={e => setOppForm(p => ({ ...p, telefone_contato: e.target.value }))} placeholder="(11) 99999-9999" className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium focus:border-violet-400 outline-none" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => { setShowNewOpp(false); setEditingOpp(null); }} className="rounded-xl">Cancelar</Button>
                                <Button onClick={handleSaveOpp} disabled={saving} className="rounded-xl bg-violet-500 hover:bg-violet-600 font-bold shadow-md">
                                    {saving ? <Loader2 size={16} className="animate-spin mr-1" /> : <Plus size={16} className="mr-1" />}
                                    {editingOpp ? 'Atualizar' : 'Criar'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Kanban Board */}
            <div className="flex-1 overflow-hidden px-6 pb-6">
                <div className="max-w-[1600px] mx-auto h-full">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                        </div>
                    ) : pipeline.length > 0 ? (
                        <KanbanBoard
                            pipeline={pipeline}
                            onDragEnd={handleDragEnd}
                            onCardClick={handleCardClick}
                            onQuickAction={handleQuickAction}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <Kanban size={40} className="text-violet-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-slate-800 mb-2">Pipeline vazio</h3>
                                <p className="text-sm text-slate-500 mb-4">Configure as etapas do funil nas configurações do CRM</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <CrmHelpModal open={showHelp} onOpenChange={setShowHelp} />
        </div>
    );
};

export default RepCrmPipeline;
