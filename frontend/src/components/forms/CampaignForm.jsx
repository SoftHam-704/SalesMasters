import React, { useState, useEffect } from 'react';
import {
    Target, Calendar, TrendingUp, DollarSign, Package,
    ArrowRight, Save, Calculator, Wallet, Receipt,
    Users, MapPin, Briefcase, FileText, Award, CheckCircle2,
    ChevronRight, ChevronLeft, Info, Plus, History, Activity,
    AlertTriangle, Check
} from 'lucide-react';
import FormCadPadraoV2 from '../FormCadPadraoV2';
import InputField from '../InputField';
import '../FormLayout.css';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DbComboBox from '../DbComboBox';
import { toast } from "sonner";
import { NODE_API_URL, getApiUrl } from '../../utils/apiConfig';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const CampaignForm = ({ data, onClose, onSave }) => {
    // Top Tabs: planning, monitoring, audit
    const [activeTab, setActiveTab] = useState("planning");

    // Planning steps (inner wizard)
    const [planStep, setPlanStep] = useState(1);

    const [loadingSim, setLoadingSim] = useState(false);
    const [loadingClient, setLoadingClient] = useState(false);
    const [loadingTracking, setLoadingTracking] = useState(false);
    const [trackingLogs, setTrackingLogs] = useState([]);
    const [showTrackingForm, setShowTrackingForm] = useState(false);

    const [form, setForm] = useState({
        cmp_codigo: null,
        cmp_descricao: '',
        cmp_cliente_id: null,
        client_name: '',
        cmp_industria_id: null,
        industry_name: '',
        cmp_promotor_id: null,

        cmp_setor: '',
        cmp_regiao: '',
        cmp_equipe_vendas: 0,

        cmp_tipo_periodo: 'TRIMESTRAL',
        cmp_periodo_base_ini: '',
        cmp_periodo_base_fim: '',

        cmp_perc_crescimento: 20.00,
        cmp_verba_solicitada: 0,

        cmp_tema: '',
        cmp_campanha_ini: '',
        cmp_campanha_fim: '',

        simulation_data: null,
        cmp_observacao: '',

        cmp_justificativa: '',
        cmp_premiacoes: '',
        cmp_status: 'SIMULACAO',

        cmp_real_valor_total: 0,
        cmp_real_qtd_total: 0
    });

    const [newTrack, setNewTrack] = useState({
        tra_data: new Date().toISOString().split('T')[0],
        tra_vlr_acumulado: 0,
        tra_qtd_acumulada: 0,
        tra_observacao: ''
    });

    // Load initial data
    useEffect(() => {
        if (data) {
            const mapped = {
                ...form,
                cmp_codigo: data.cmp_codigo,
                cmp_descricao: data.cmp_descricao || '',
                cmp_cliente_id: data.cmp_cliente_id || null,
                client_name: data.cli_nomred || data.cli_nome || '',
                cmp_industria_id: data.cmp_industria_id || null,
                industry_name: data.industria_nome || '',
                cmp_promotor_id: data.cmp_promotor_id || null,
                cmp_setor: data.cmp_setor || '',
                cmp_regiao: data.cmp_regiao || '',
                cmp_equipe_vendas: data.cmp_equipe_vendas || 0,
                cmp_tipo_periodo: data.cmp_tipo_periodo || 'TRIMESTRAL',
                cmp_periodo_base_ini: data.cmp_periodo_base_ini ? data.cmp_periodo_base_ini.split('T')[0] : '',
                cmp_periodo_base_fim: data.cmp_periodo_base_fim ? data.cmp_periodo_base_fim.split('T')[0] : '',
                cmp_campanha_ini: data.cmp_campanha_ini ? data.cmp_campanha_ini.split('T')[0] : '',
                cmp_campanha_fim: data.cmp_campanha_fim ? data.cmp_campanha_fim.split('T')[0] : '',
                cmp_perc_crescimento: parseFloat(data.cmp_perc_crescimento) || 20.00,
                cmp_verba_solicitada: parseFloat(data.cmp_verba_solicitada) || 0,
                cmp_tema: data.cmp_tema || '',
                cmp_observacao: data.cmp_observacao || '',
                cmp_justificativa: data.cmp_justificativa || '',
                cmp_premiacoes: data.cmp_premiacoes || '',
                cmp_status: data.cmp_status || 'SIMULACAO',
                cmp_real_valor_total: parseFloat(data.cmp_real_valor_total) || 0,
                cmp_real_qtd_total: parseFloat(data.cmp_real_qtd_total) || 0,
                simulation_data: data.cmp_base_valor_total ? {
                    base: {
                        days: parseInt(data.cmp_base_dias_kpi) || 0,
                        total_value: parseFloat(data.cmp_base_valor_total) || 0,
                        total_qty: parseFloat(data.cmp_base_qtd_total) || 0,
                        daily_avg_value: parseFloat(data.cmp_base_media_diaria_val) || 0,
                        daily_avg_qty: parseFloat(data.cmp_base_media_diaria_qtd) || 0
                    },
                    projection: {
                        growth_percent: parseFloat(data.cmp_perc_crescimento) || 0,
                        target_total_value: parseFloat(data.cmp_meta_valor_total) || 0,
                        target_total_qty: parseFloat(data.cmp_meta_qtd_total) || 0,
                        target_daily_value: parseFloat(data.cmp_meta_diaria_val) || 0,
                        target_daily_qty: parseFloat(data.cmp_meta_diaria_qtd) || 0,
                        days: 0 // Will be calc below
                    }
                } : null
            };

            setForm(mapped);
            fetchTracking(data.cmp_codigo);

            // If editing, default to monitoring if active
            if (data.cmp_status === 'ATIVA' || data.cmp_status === 'CONCLUIDA') {
                setActiveTab("monitoring");
            }
        } else {
            const end = new Date();
            const start = new Date();
            start.setMonth(end.getMonth() - 3);
            setForm(prev => ({
                ...prev,
                cmp_periodo_base_ini: start.toISOString().split('T')[0],
                cmp_periodo_base_fim: end.toISOString().split('T')[0]
            }));
        }
    }, [data]);

    const fetchTracking = async (id) => {
        if (!id) return;
        setLoadingTracking(true);
        try {
            const res = await fetch(getApiUrl(NODE_API_URL, `/api/v2/campaigns/${id}/tracking`));
            const json = await res.json();
            if (json.success) setTrackingLogs(json.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingTracking(false);
        }
    };

    const handleAddTracking = async () => {
        if (!newTrack.tra_vlr_acumulado) {
            toast.error("Informe o valor acumulado.");
            return;
        }
        try {
            const res = await fetch(getApiUrl(NODE_API_URL, `/api/v2/campaigns/${form.cmp_codigo}/tracking`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTrack)
            });
            const json = await res.json();
            if (json.success) {
                toast.success("Progresso lançado com sucesso!");
                setShowTrackingForm(false);
                fetchTracking(form.cmp_codigo);
                setForm(prev => ({
                    ...prev,
                    cmp_real_valor_total: newTrack.tra_vlr_acumulado,
                    cmp_real_qtd_total: newTrack.tra_qtd_acumulada
                }));
            }
        } catch (error) {
            toast.error("Erro ao lançar progresso.");
        }
    };

    const handleDeleteTrack = async (tid) => {
        if (!window.confirm("Remover este lançamento?")) return;
        try {
            const res = await fetch(getApiUrl(NODE_API_URL, `/api/v2/campaigns/tracking/${tid}`), { method: 'DELETE' });
            const json = await res.json();
            if (json.success) {
                toast.success("Lançamento removido.");
                fetchTracking(form.cmp_codigo);
                // Update local form state (the backend already updated cmp_real_valor_total)
                // We could re-fetch the entire campaign but let's just update based on remaining logs
                const remaining = trackingLogs.filter(t => t.tra_id !== tid);
                const latest = remaining[0];
                setForm(prev => ({
                    ...prev,
                    cmp_real_valor_total: latest ? latest.tra_vlr_acumulado : 0,
                    cmp_real_qtd_total: latest ? latest.tra_qtd_acumulada : 0
                }));
            }
        } catch (error) {
            toast.error("Erro ao remover.");
        }
    };

    const handleSimulate = async () => {
        if (!form.cmp_cliente_id || !form.cmp_industria_id || !form.cmp_periodo_base_ini || !form.cmp_periodo_base_fim) {
            toast.error("Preencha os dados básicos.");
            return;
        }
        setLoadingSim(true);
        try {
            const res = await fetch(getApiUrl(NODE_API_URL, '/api/v2/campaigns/simulate'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: form.cmp_cliente_id,
                    industry_id: form.cmp_industria_id,
                    base_start: form.cmp_periodo_base_ini,
                    base_end: form.cmp_periodo_base_fim,
                    campaign_start: form.cmp_campanha_ini || form.cmp_periodo_base_ini,
                    campaign_end: form.cmp_campanha_fim || form.cmp_periodo_base_fim,
                    growth_percent: form.cmp_perc_crescimento
                })
            });
            const json = await res.json();
            if (json.success) {
                setForm(prev => ({
                    ...prev,
                    simulation_data: json.data,
                    cmp_verba_solicitada: (json.data.projection.target_total_value * 0.02).toFixed(2)
                }));
                setPlanStep(2);
                toast.success("Simulação concluída!");
            }
        } catch (error) {
            toast.error("Erro na simulação.");
        } finally {
            setLoadingSim(false);
        }
    };

    const formatCurrency = (val) => {
        if (!val) return '';
        const numericValue = val.toString().replace(/\D/g, '');
        const floatValue = parseFloat(numericValue) / 100;
        return floatValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const handleCurrencyChange = (e) => {
        const value = e.target.value.replace(/\D/g, '');
        const floatValue = parseFloat(value) / 100;
        setForm({ ...form, cmp_verba_solicitada: floatValue });
    };
    const getPerformance = () => {
        if (!form.simulation_data || !form.cmp_campanha_ini || !form.cmp_campanha_fim) return null;

        const start = new Date(form.cmp_campanha_ini);
        const end = new Date(form.cmp_campanha_fim);
        const today = new Date();

        const totalDuration = Math.max(1, (end - start) / (1000 * 60 * 60 * 24) + 1);
        const elapsed = Math.max(0, Math.min(totalDuration, (today - start) / (1000 * 60 * 60 * 24)));

        const timePerc = (elapsed / totalDuration);
        const progPerc = (form.cmp_real_valor_total / form.simulation_data.projection.target_total_value);

        const ip = timePerc > 0 ? (progPerc / timePerc) : 1;

        return {
            ip,
            timePerc: timePerc * 100,
            progPerc: progPerc * 100,
            risk: ip >= 1.0 ? 'LOW' : ip >= 0.8 ? 'MEDIUM' : 'HIGH',
            remainingDays: Math.ceil(totalDuration - elapsed),
            neededDaily: (form.simulation_data.projection.target_total_value - form.cmp_real_valor_total) / Math.max(1, totalDuration - elapsed)
        };
    };

    const perf = getPerformance();

    const chartDataVal = form.simulation_data ? {
        labels: ['Média Diária (Base)', 'Meta Diária (Objetivo)'],
        datasets: [{
            data: [form.simulation_data.base.daily_avg_value, form.simulation_data.projection.target_daily_value],
            backgroundColor: ['#94a3b8', '#10b981'],
            borderRadius: 8,
        }]
    } : null;

    return (
        <FormCadPadraoV2
            title={data ? "Gestão Estratégica de Campanha" : "Nova Campanha 1-a-1"}
            onSave={() => onSave(form)}
            onCancel={onClose}
            saveLabel={data ? "Salvar Alterações" : "Salvar e Ativar"}
        >
            <div className="flex flex-col h-full bg-slate-50 overflow-hidden max-w-[1600px] mx-auto">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                    <div className="bg-white border-b px-8 pt-4">
                        <TabsList className="bg-slate-100 p-1 mb-[-2px]">
                            <TabsTrigger value="planning" className="data-[state=active]:bg-white data-[state=active]:text-emerald-700 font-bold px-6">
                                <FileText className="w-4 h-4 mr-2" /> PLANEJAMENTO
                            </TabsTrigger>
                            <TabsTrigger value="monitoring" disabled={!form.simulation_data} className="data-[state=active]:bg-white data-[state=active]:text-emerald-700 font-bold px-6">
                                <Activity className="w-4 h-4 mr-2" /> MONITORAMENTO (REALIZADO)
                            </TabsTrigger>
                            <TabsTrigger value="audit" disabled={!data} className="data-[state=active]:bg-white data-[state=active]:text-emerald-700 font-bold px-6">
                                <Award className="w-4 h-4 mr-2" /> AUDITORIA & CIERRE
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 overflow-auto p-8">
                        {/* PLANEJAMENTO TAB */}
                        <TabsContent value="planning" className="m-0 space-y-8 animate-in fade-in duration-300">
                            {planStep === 1 ? (
                                <div className="max-w-4xl mx-auto space-y-8">
                                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                                        <div className="border-l-4 border-emerald-500 pl-4">
                                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Configuração Inicial</h3>
                                            <p className="text-sm text-slate-500">Defina o alvo, parceiro e período de análise histórico.</p>
                                        </div>

                                        <div className="grid grid-cols-12 gap-6">
                                            <div className="col-span-12">
                                                <Label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Título da Ação Comercial</Label>
                                                <Input
                                                    value={form.cmp_descricao}
                                                    onChange={e => setForm({ ...form, cmp_descricao: e.target.value })}
                                                    placeholder="Ex: Desafio Q1 2026 - Aceleração de Mix"
                                                    className="h-12 text-lg font-bold border-slate-200 focus:ring-emerald-500"
                                                />
                                            </div>
                                            <div className="col-span-12 md:col-span-6">
                                                <Label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Parceiro (Lojista)</Label>
                                                <DbComboBox
                                                    placeholder="Selecionar cliente..."
                                                    value={form.client_name ? { cli_codigo: form.cmp_cliente_id, cli_nomred: form.client_name } : null}
                                                    onChange={(id, item) => setForm(prev => ({ ...prev, cmp_cliente_id: item.cli_codigo, client_name: item.cli_nomred }))}
                                                    fetchData={async (search) => {
                                                        const res = await fetch(getApiUrl(NODE_API_URL, `/api/aux/clientes?pesquisa=${encodeURIComponent(search)}&limit=10`));
                                                        const json = await res.json();
                                                        return json.data || [];
                                                    }}
                                                    labelKey="cli_nomred"
                                                    valueKey="cli_codigo"
                                                />
                                            </div>
                                            <div className="col-span-12 md:col-span-6">
                                                <Label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Indústria / Fornecedor</Label>
                                                <DbComboBox
                                                    placeholder="Selecionar indústria..."
                                                    value={form.industry_name ? { for_codigo: form.cmp_industria_id, for_nomered: form.industry_name } : null}
                                                    onChange={(id, item) => setForm(prev => ({ ...prev, cmp_industria_id: item.for_codigo, industry_name: item.for_nomered || item.for_nome }))}
                                                    fetchData={async (search) => {
                                                        const res = await fetch(getApiUrl(NODE_API_URL, `/api/aux/industrias?pesquisa=${encodeURIComponent(search)}&limit=10`));
                                                        const json = await res.json();
                                                        return json.data || [];
                                                    }}
                                                    labelKey="for_nomered"
                                                    valueKey="for_codigo"
                                                />
                                            </div>

                                            <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                                <div>
                                                    <Label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Setor</Label>
                                                    <Input value={form.cmp_setor} onChange={e => setForm({ ...form, cmp_setor: e.target.value })} className="h-11 bg-white border-slate-200" />
                                                </div>
                                                <div>
                                                    <Label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Região</Label>
                                                    <Input value={form.cmp_regiao} onChange={e => setForm({ ...form, cmp_regiao: e.target.value })} className="h-11 bg-white border-slate-200" />
                                                </div>
                                                <div>
                                                    <Label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Equipe (Qtd)</Label>
                                                    <Input type="number" value={form.cmp_equipe_vendas} onChange={e => setForm({ ...form, cmp_equipe_vendas: e.target.value })} className="h-11 bg-white border-slate-200" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-8 rounded-3xl shadow-lg relative overflow-hidden border border-slate-200">
                                        <div className="absolute top-0 right-0 p-8 opacity-5">
                                            <TrendingUp size={100} className="text-slate-900" />
                                        </div>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-200">2</div>
                                            <h3 className="text-xl font-black uppercase text-slate-800 tracking-tight">Análise de Potencial</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                                            <div className="space-y-4">
                                                <label className="text-slate-500 font-black text-xs uppercase tracking-wider block mb-2">Janela de Histórico</label>
                                                <Select value={form.cmp_tipo_periodo} onValueChange={v => setForm({ ...form, cmp_tipo_periodo: v })}>
                                                    <SelectTrigger className="bg-slate-50 border-slate-200 h-12 text-slate-900">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="BIMESTRAL">Bimestral (60 dias)</SelectItem>
                                                        <SelectItem value="TRIMESTRAL">Trimestral (90 dias)</SelectItem>
                                                        <SelectItem value="SEMESTRAL">Semestral (180 dias)</SelectItem>
                                                        <SelectItem value="ANUAL">Anual (365 dias)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs text-slate-600 uppercase font-black tracking-widest block mb-1">Início</label>
                                                    <Input type="date" value={form.cmp_periodo_base_ini} onChange={e => setForm({ ...form, cmp_periodo_base_ini: e.target.value })} className="bg-slate-50 border-slate-200 text-slate-900 font-bold" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs text-slate-600 uppercase font-black tracking-widest block mb-1">Fim</label>
                                                    <Input type="date" value={form.cmp_periodo_base_fim} onChange={e => setForm({ ...form, cmp_periodo_base_fim: e.target.value })} className="bg-slate-50 border-slate-200 text-slate-900 font-bold" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-8 flex justify-center">
                                            <Button size="lg" onClick={handleSimulate} disabled={loadingSim} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-16 h-14 text-lg rounded-2xl shadow-xl shadow-emerald-100 transition-all active:scale-95">
                                                {loadingSim ? 'ANALISANDO DADOS...' : 'CALCULAR OBJETIVOS DE VENDA'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="max-w-6xl mx-auto grid grid-cols-12 gap-8">
                                    <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
                                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 px-2">Resultado da Performance Base</h4>
                                            <div className="grid grid-cols-4 gap-6 px-2">
                                                <div className="space-y-1">
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">Total Vendido</span>
                                                    <div className="text-xl font-black text-slate-800">R$ {form.simulation_data.base.total_value.toLocaleString()}</div>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">Dias Úteis</span>
                                                    <div className="text-xl font-black text-slate-800">{form.simulation_data.base.days} d</div>
                                                </div>
                                                <div className="col-span-2 bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between">
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] text-emerald-700 font-bold uppercase">Média Diária Real</span>
                                                        <div className="text-2xl font-black text-emerald-700">R$ {form.simulation_data.base.daily_avg_value.toLocaleString()}</div>
                                                    </div>
                                                    <Info className="text-emerald-300" />
                                                </div>
                                            </div>
                                            <div className="h-48 mt-8">
                                                <Bar data={chartDataVal} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
                                            </div>
                                        </div>

                                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-2 gap-8">
                                            <div className="col-span-2 border-b pb-4 mb-2">
                                                <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                                    <Calendar className="text-emerald-500" /> Datas e Tema da Campanha
                                                </h4>
                                            </div>
                                            <div className="col-span-2">
                                                <Label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Tema Principal (Mote)</Label>
                                                <Input
                                                    value={form.cmp_tema}
                                                    onChange={e => setForm({ ...form, cmp_tema: e.target.value })}
                                                    placeholder="Ex: Queima de Estoque / Lançamento Verão..."
                                                    className="h-12 text-lg border-slate-200"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase text-slate-500">Início da Campanha</Label>
                                                <Input type="date" value={form.cmp_campanha_ini} onChange={e => setForm({ ...form, cmp_campanha_ini: e.target.value })} className="h-10" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase text-slate-500">Fim da Campanha</Label>
                                                <Input type="date" value={form.cmp_campanha_fim} onChange={e => setForm({ ...form, cmp_campanha_fim: e.target.value })} className="h-10" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
                                        <div className="bg-white p-8 rounded-[32px] shadow-lg border-t-8 border-t-emerald-500 relative overflow-hidden border border-slate-200">
                                            <div className="absolute top-[-20px] right-[-20px] opacity-5 text-slate-900">
                                                <TrendingUp size={120} />
                                            </div>

                                            <label className="text-slate-500 font-black text-xs uppercase tracking-[0.2em] mb-6 block">Alvo de Crescimento</label>

                                            <div className="flex items-center justify-center gap-2 mb-8 bg-slate-50 py-6 rounded-2xl border border-slate-100">
                                                <Input
                                                    type="number"
                                                    value={form.cmp_perc_crescimento}
                                                    onChange={e => setForm({ ...form, cmp_perc_crescimento: e.target.value })}
                                                    className="w-32 h-20 text-5xl font-black text-center bg-transparent border-none text-slate-900 focus:ring-0 p-0"
                                                />
                                                <span className="text-4xl font-black text-slate-300">%</span>
                                            </div>

                                            <div className="space-y-4 pt-6 border-t border-slate-100">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Meta Diária Projetada</span>
                                                    <span className="text-xl font-black text-slate-800">R$ {(form.simulation_data.base.daily_avg_value * (1 + form.cmp_perc_crescimento / 100)).toLocaleString()}</span>
                                                </div>

                                                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 mt-4">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Verba Solicitada (Meta: {form.simulation_data ? ((form.cmp_verba_solicitada / form.simulation_data.projection.target_total_value) * 100).toFixed(2) : 0}%)</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-2xl font-black text-emerald-600">R$</span>
                                                        <input
                                                            type="text"
                                                            value={formatCurrency(form.cmp_verba_solicitada)}
                                                            onChange={handleCurrencyChange}
                                                            className="bg-transparent border-none text-2xl font-black text-slate-900 p-0 h-auto focus:ring-0 w-full outline-none"
                                                            placeholder="0,00"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-4">
                                            <Label className="text-xs font-bold uppercase text-slate-400 flex items-center gap-2 mb-2">
                                                <FileText className="w-4 h-4 text-emerald-500" /> Observações Estratégicas
                                            </Label>
                                            <Textarea
                                                value={form.cmp_observacao}
                                                onChange={e => setForm({ ...form, cmp_observacao: e.target.value })}
                                                className="min-h-[140px] bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-100 p-4"
                                                placeholder="Combine aqui bonificações, prazos extras ou mix obrigatório..."
                                            />
                                        </div>

                                        <div className="flex flex-col gap-3 pt-2">
                                            <Button
                                                size="lg"
                                                onClick={() => onSave(form)}
                                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-16 rounded-2xl font-black text-lg shadow-lg shadow-emerald-200 transition-all active:scale-95"
                                            >
                                                FINALIZAR PLANEJAMENTO
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                onClick={() => setPlanStep(1)}
                                                className="w-full h-12 font-bold text-slate-400 hover:text-slate-600"
                                            >
                                                ALTERAR DADOS BASE
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        {/* MONITORING TAB */}
                        <TabsContent value="monitoring" className="m-0 space-y-8 animate-in fade-in duration-300">
                            <div className="grid grid-cols-12 gap-8">
                                {/* Left Side: Performance Dashboard */}
                                <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* IP Card */}
                                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden flex flex-col justify-between">
                                            {perf?.ip >= 1 ? (
                                                <div className="absolute top-0 right-0 p-8 text-emerald-100"><CheckCircle2 size={80} /></div>
                                            ) : (
                                                <div className="absolute top-0 right-0 p-8 text-amber-100"><AlertTriangle size={80} /></div>
                                            )}

                                            <div>
                                                <Label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 block">Índice de Performance (IP)</Label>
                                                <div className="flex items-baseline gap-2">
                                                    <span className={`text-6xl font-black ${perf?.ip >= 1 ? 'text-emerald-500' : perf?.ip >= 0.8 ? 'text-amber-500' : 'text-rose-500'}`}>
                                                        {perf?.ip.toFixed(2)}
                                                    </span>
                                                    <span className="text-slate-400 font-bold">SCORE</span>
                                                </div>
                                                <div className="mt-4">
                                                    <span className={`px-4 py-1.5 rounded-full font-black text-xs uppercase ${perf?.risk === 'LOW' ? 'bg-emerald-100 text-emerald-700' :
                                                        perf?.risk === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-rose-100 text-rose-700'
                                                        }`}>
                                                        {perf?.risk === 'LOW' ? 'DESEMPENHO EXCELENTE' : perf?.risk === 'MEDIUM' ? 'ATENÇÃO NECESSÁRIA' : 'RISCO CRÍTICO'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mt-8 space-y-4 pt-6 border-t border-slate-100">
                                                <div className="flex justify-between items-center text-sm font-bold">
                                                    <span className="text-slate-500">Progresso do Faturamento</span>
                                                    <span className="text-slate-800">{perf?.progPerc?.toFixed(1) || '0.0'}%</span>
                                                </div>
                                                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-1000 ${perf?.ip >= 1 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                                        style={{ width: `${Math.min(100, perf?.progPerc || 0)}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between items-center text-sm font-bold">
                                                    <span className="text-slate-500">Tempo Decorrido</span>
                                                    <span className="text-slate-800">{perf?.timePerc?.toFixed(1) || '0.0'}%</span>
                                                </div>
                                                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-slate-300 transition-all duration-1000" style={{ width: `${perf?.timePerc || 0}%` }} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Financial Summary */}
                                        <div className="bg-slate-900 p-8 rounded-[32px] text-white shadow-xl flex flex-col justify-between border-b-8 border-b-slate-800">
                                            <div className="space-y-8">
                                                <div>
                                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white mb-2 block" style={{ color: 'white' }}>Vendido até o momento</Label>
                                                    <div className="text-4xl font-black text-white">R$ {form.cmp_real_valor_total.toLocaleString()}</div>
                                                </div>

                                                <div className="flex flex-col gap-4">
                                                    <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-800">
                                                        <Label className="text-[10px] font-bold text-white uppercase block mb-2 tracking-wider" style={{ color: 'white' }}>Restam</Label>
                                                        <div className="text-3xl font-black text-white">{(perf?.remainingDays || 0)} <span className="text-xs text-slate-500 font-bold uppercase">dias</span></div>
                                                    </div>
                                                    <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-800">
                                                        <Label className="text-[10px] font-bold text-white uppercase block mb-2 tracking-wider" style={{ color: 'white' }}>Faltam</Label>
                                                        <div className="text-2xl font-black text-rose-400">R$ {Math.max(0, (form.simulation_data?.projection?.target_total_value || 0) - form.cmp_real_valor_total).toLocaleString()}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-10 bg-emerald-600 p-6 rounded-2xl border-l-[12px] border-emerald-400 shadow-lg">
                                                <Label className="text-[10px] font-black uppercase text-emerald-100 block mb-2 tracking-widest">Média Diária Necessária</Label>
                                                <div className="text-3xl font-black text-white">R$ {(perf?.neededDaily || 0).toLocaleString()}</div>
                                                <p className="text-[10px] text-emerald-100 font-bold mt-2 opacity-80 uppercase tracking-tighter">Para atingir 100% do objetivo.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tracking List */}
                                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                                        <div className="flex justify-between items-center mb-6">
                                            <h4 className="text-lg font-black text-slate-800 uppercase flex items-center gap-2">
                                                <History className="text-emerald-500" /> Histórico de Lançamentos
                                            </h4>
                                            <Button onClick={() => setShowTrackingForm(true)} className="bg-emerald-600 text-white rounded-full h-10 px-6 font-bold hover:bg-emerald-700 hover:scale-105 transition-all gap-2 shadow-lg shadow-emerald-100">
                                                <Plus size={16} /> LANÇAR PROGRESSO
                                            </Button>
                                        </div>

                                        <div className="space-y-4">
                                            {trackingLogs.map(log => (
                                                <div key={log.tra_id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 group">
                                                    <div className="flex items-center gap-6">
                                                        <div className="bg-white p-3 rounded-xl border border-slate-200 text-center min-w-[70px]">
                                                            <div className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">DATA</div>
                                                            <div className="text-sm font-black text-slate-800">
                                                                {new Date(log.tra_data).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] font-bold text-slate-400 uppercase">ACUMULADO</div>
                                                            <div className="text-lg font-black text-slate-800">R$ {parseFloat(log.tra_vlr_acumulado).toLocaleString()}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] font-bold text-slate-400 uppercase">VOLUME</div>
                                                            <div className="text-lg font-bold text-slate-600">{parseFloat(log.tra_qtd_acumulada).toFixed(0)} un</div>
                                                        </div>
                                                        {log.tra_observacao && (
                                                            <div className="hidden md:block max-w-[200px]">
                                                                <div className="text-[10px] font-bold text-slate-400 uppercase">OBS</div>
                                                                <div className="text-xs text-slate-500 truncate">{log.tra_observacao}</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button onClick={() => handleDeleteTrack(log.tra_id)} className="p-2 text-rose-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <AlertTriangle size={18} />
                                                    </button>
                                                </div>
                                            ))}
                                            {trackingLogs.length === 0 && (
                                                <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                                    <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                                    <p className="text-slate-400 font-bold uppercase text-xs">Nenhum progresso lançado até o momento.</p>
                                                    <Button variant="link" onClick={() => setShowTrackingForm(true)} className="text-emerald-600 font-bold mt-2">LANÇAR PRIMEIRO RESULTADO</Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Mini Summary */}
                                <div className="col-span-12 lg:col-span-4 space-y-8">
                                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Controle Térmico</h4>
                                        <div className="flex justify-center py-4">
                                            <div className="relative w-48 h-48">
                                                <Doughnut
                                                    data={{
                                                        datasets: [{
                                                            data: [perf?.progPerc, 100 - perf?.progPerc],
                                                            backgroundColor: [
                                                                perf?.risk === 'LOW' ? '#10b981' : perf?.risk === 'MEDIUM' ? '#fbbf24' : '#f43f5e',
                                                                '#f1f5f9'
                                                            ],
                                                            borderWidth: 0,
                                                            circumference: 180,
                                                            rotation: 270,
                                                            cutout: '80%'
                                                        }]
                                                    }}
                                                    options={{ cutout: '80%', plugins: { tooltip: { enabled: false }, legend: { display: false } } }}
                                                />
                                                <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                                                    <span className="text-4xl font-black text-slate-800">{Math.min(100, perf?.progPerc || 0).toFixed(0)}%</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">DA META</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4 px-2">
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Meta Financeira</div>
                                                <div className="text-lg font-black text-slate-800">R$ {form.simulation_data?.projection?.target_total_value?.toLocaleString() || '0,00'}</div>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Verba Alocada</div>
                                                <div className="text-lg font-black text-amber-600">R$ {parseFloat(form.cmp_verba_solicitada || 0).toLocaleString()}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-8 rounded-3xl text-white shadow-lg text-center">
                                        <Award className="w-12 h-12 mx-auto mb-4 text-emerald-300" />
                                        <h4 className="text-lg font-black uppercase mb-2">Auditores & Gestores</h4>
                                        <p className="text-xs text-emerald-100 mb-6">Para finalizar a campanha e liberar as premiações, preencha todos os campos da Auditoria.</p>
                                        <Button onClick={() => setActiveTab("audit")} className="bg-white text-emerald-700 font-black w-full h-12 rounded-xl">IR PARA AUDITORIA</Button>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* AUDIT TAB */}
                        <TabsContent value="audit" className="m-0 space-y-8 animate-in fade-in duration-300">
                            <div className="max-w-4xl mx-auto space-y-8">
                                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
                                    <div className="border-l-4 border-emerald-500 pl-4">
                                        <h3 className="text-xl font-black text-slate-800 uppercase">Fechamento e Auditoria de Resultado</h3>
                                        <p className="text-sm text-slate-500">Registre formalmente os motivos do sucesso ou fracasso da ação comercial.</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="col-span-2 md:col-span-1 bg-slate-900 p-6 rounded-3xl text-white">
                                            <Label className="text-[10px] font-bold text-white uppercase block mb-4" style={{ color: 'white' }}>Resultado Final Consolidado</Label>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center pr-2">
                                                    <span className="text-sm font-medium text-slate-400">Total Vendido</span>
                                                    <span className="text-2xl font-black">R$ {form.cmp_real_valor_total.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between items-center pr-2">
                                                    <span className="text-sm font-medium text-slate-400">Volume Total</span>
                                                    <span className="text-2xl font-black">{form.cmp_real_qtd_total.toLocaleString()} un</span>
                                                </div>
                                                <div className="pt-4 border-t border-slate-800 mt-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-emerald-400 font-black uppercase text-xs">Crescimento Final</span>
                                                        <span className={`text-2xl font-black ${perf?.progPerc >= 100 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                            {perf?.progPerc.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-span-2 md:col-span-1 space-y-6">
                                            <div>
                                                <Label className="text-sm font-bold text-slate-700 mb-2 block">Status da Campanha</Label>
                                                <Select value={form.cmp_status} onValueChange={v => setForm({ ...form, cmp_status: v })}>
                                                    <SelectTrigger className="h-14 font-black text-slate-800 border-2 border-slate-100">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="SIMULACAO">SIMULAÇÃO (EM PLANEJAMENTO)</SelectItem>
                                                        <SelectItem value="ATIVA">ATIVA (EM ANDAMENTO)</SelectItem>
                                                        <SelectItem value="CONCLUIDA">CONCLUÍDA (FECHADA)</SelectItem>
                                                        <SelectItem value="CANCELADA">CANCELADA</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                                                <Label className="text-xs font-bold text-amber-800 mb-2 block uppercase">Atenção</Label>
                                                <p className="text-[10px] text-amber-700 font-medium">Ao mudar para CONCLUÍDA, a campanha deixará de aparecer no radar de monitoramento ativo do CRM.</p>
                                            </div>
                                        </div>

                                        <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                    <Receipt className="text-emerald-500" /> Justificativa de Desempenho
                                                </Label>
                                                <Textarea
                                                    value={form.cmp_justificativa}
                                                    onChange={e => setForm({ ...form, cmp_justificativa: e.target.value })}
                                                    placeholder="Descreva aqui o porquê do resultado ter sido atingido ou não..."
                                                    className="min-h-[150px] bg-slate-50 border-none rounded-2xl"
                                                />
                                            </div>
                                            <div className="space-y-4">
                                                <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                    <Award className="text-purple-500" /> Premiações Entregues
                                                </Label>
                                                <Textarea
                                                    value={form.cmp_premiacoes}
                                                    onChange={e => setForm({ ...form, cmp_premiacoes: e.target.value })}
                                                    placeholder="Quais prêmios foram entregues aos envolvidos?"
                                                    className="min-h-[150px] bg-purple-50/30 border-none rounded-2xl"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-8">
                                        <Button size="lg" onClick={() => onSave(form)} className="bg-emerald-600 text-white font-black px-12 h-14 text-lg rounded-2xl border-b-4 border-emerald-800 active:border-b-0 hover:bg-emerald-700 shadow-lg shadow-emerald-100">
                                            ENCERRAR E SALVAR TUDO
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            </div>

            {/* Tracking Modal (Launch Progress) */}
            {showTrackingForm && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                                <Activity />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800 uppercase leading-none">Lançar Progresso</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Acompanhamento de Realizado</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <Label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Data do Levantamento</Label>
                                <Input
                                    type="date"
                                    value={newTrack.tra_data}
                                    onChange={e => setNewTrack({ ...newTrack, tra_data: e.target.value })}
                                    className="h-12 border-slate-100 bg-slate-50 font-bold"
                                />
                            </div>
                            <div>
                                <Label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Valor Acumulado (R$)</Label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3.5 text-slate-400 font-bold">R$</span>
                                    <Input
                                        type="number"
                                        value={newTrack.tra_vlr_acumulado}
                                        onChange={e => setNewTrack({ ...newTrack, tra_vlr_acumulado: e.target.value })}
                                        className="h-14 pl-12 text-2xl font-black border-emerald-100 focus:ring-emerald-500"
                                        placeholder="0,00"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Quantidade Acumulada (Un)</Label>
                                <Input
                                    type="number"
                                    value={newTrack.tra_qtd_acumulada}
                                    onChange={e => setNewTrack({ ...newTrack, tra_qtd_acumulada: e.target.value })}
                                    className="h-12 border-slate-100 bg-slate-50 font-bold"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <Label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Observação (Opcional)</Label>
                                <Textarea
                                    value={newTrack.tra_observacao}
                                    onChange={e => setNewTrack({ ...newTrack, tra_observacao: e.target.value })}
                                    className="min-h-[80px] border-slate-100 bg-slate-50"
                                    placeholder="Ex: Valor levantado direto no PDV..."
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-10">
                            <Button variant="ghost" onClick={() => setShowTrackingForm(false)} className="h-12 font-bold text-slate-400">CANCELAR</Button>
                            <Button onClick={handleAddTracking} className="h-12 bg-emerald-600 font-black text-white rounded-xl shadow-lg shadow-emerald-200">
                                LANÇAR AGORA
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </FormCadPadraoV2>
    );
};

export default CampaignForm;
