import { useState, useEffect } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    Loader2, MessageCircle, Calendar, Clock, 
    User, Target, CheckCircle2, Building2, 
    Send, MapPin, Search, Check
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import DbComboBox from '@/components/DbComboBox';
import axios from '@/lib/axios';

const NovaInteracaoModal = ({ open, onClose, onSuccess, editData = null, preData = null }) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const isEditMode = !!editData;

    // Form states
    const [clienteId, setClienteId] = useState(null);
    const [clienteLabel, setClienteLabel] = useState('');
    const [canalId, setCanalId] = useState('');
    const [tipoId, setTipoId] = useState('');
    const [resultadoId, setResultadoId] = useState('');
    const [descricao, setDescricao] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    const [oportunidadeId, setOportunidadeId] = useState(null);
    const [industriasSelecionadas, setIndustriasSelecionadas] = useState(new Set());

    // Lookups
    const [tipos, setTipos] = useState([]);
    const [canais, setCanais] = useState([]);
    const [resultados, setResultados] = useState([]);
    const [industriasList, setIndustriasList] = useState([]);

    const fetchLookupData = async () => {
        setLoading(true);
        try {
            const [tiposRes, canaisRes, resultadosRes, industriasRes] = await Promise.all([
                axios.get('/crm/tipos'),
                axios.get('/crm/canais'),
                axios.get('/crm/resultados'),
                axios.get('/suppliers?status=A')
            ]);

            setTipos(tiposRes.data.success ? tiposRes.data.data : (Array.isArray(tiposRes.data) ? tiposRes.data : []));
            setCanais(canaisRes.data.success ? canaisRes.data.data : (Array.isArray(canaisRes.data) ? canaisRes.data : []));
            setResultados(resultadosRes.data.success ? resultadosRes.data.data : (Array.isArray(resultadosRes.data) ? resultadosRes.data : []));
            setIndustriasList(industriasRes.data.success ? industriasRes.data.data : (Array.isArray(industriasRes.data) ? industriasRes.data : []));
        } catch (error) {
            console.error('Erro ao carregar lookups:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setClienteId(null); setClienteLabel('');
        setCanalId(''); setTipoId(''); setResultadoId('');
        setDescricao(''); setOportunidadeId(null);
        setIndustriasSelecionadas(new Set());
        setDate(new Date().toISOString().split('T')[0]);
        setTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    };

    const toggleIndustria = (forCodigo) => {
        setIndustriasSelecionadas(prev => {
            const next = new Set(prev);
            if (next.has(forCodigo)) {
                next.delete(forCodigo);
            } else {
                next.add(forCodigo);
            }
            return next;
        });
    };

    useEffect(() => {
        if (open) {
            fetchLookupData();
            if (editData) {
                setClienteId(editData.cli_codigo);
                setClienteLabel(editData.cli_nomred || '');
                setCanalId(editData.canal_id || '');
                setTipoId(editData.tipo_interacao_id || '');
                setResultadoId(editData.resultado_id || '');
                setDescricao(editData.descricao || '');
                // Load multi-industry from backend array
                if (editData.industrias && Array.isArray(editData.industrias)) {
                    setIndustriasSelecionadas(new Set(editData.industrias.map(Number)));
                } else if (editData.for_codigo) {
                    // Fallback: single industry (legacy)
                    setIndustriasSelecionadas(new Set([editData.for_codigo]));
                } else {
                    setIndustriasSelecionadas(new Set());
                }
                if (editData.data_interacao) {
                    const d = new Date(editData.data_interacao);
                    setDate(d.toISOString().split('T')[0]);
                    setTime(d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
                }
            } else {
                resetForm();
                if (preData) {
                    if (preData.canal_id) setCanalId(preData.canal_id);
                    if (preData.tipo_interacao_id) setTipoId(preData.tipo_interacao_id);
                    if (preData.cli_codigo) {
                        setClienteId(preData.cli_codigo);
                        setClienteLabel(preData.cli_nomred || '');
                    }
                }
            }
        }
    }, [open, editData]);

    const handleSave = async () => {
        if (!clienteId || !tipoId || !canalId || !descricao) {
            return toast.error('Preencha os campos obrigatórios (Cliente, Tipo, Canal e Descrição)');
        }

        setSaving(true);
        try {
            const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
            const ven_codigo = userData.ven_codigo;

            if (!ven_codigo) {
                toast.error('Código do vendedor não encontrado na sessão');
                setSaving(false);
                return;
            }

            const dataHora = `${date}T${time}:00`;
            const payload = {
                cli_codigo: clienteId,
                canal_id: parseInt(canalId),
                tipo_interacao_id: parseInt(tipoId),
                resultado_id: resultadoId ? parseInt(resultadoId) : null,
                descricao,
                data_interacao: dataHora,
                oportunidade_id: oportunidadeId,
                industrias: Array.from(industriasSelecionadas),
                ven_codigo: ven_codigo
            };

            if (isEditMode) {
                await axios.put(`/crm/interacoes/${editData.interacao_id}`, payload);
            } else {
                await axios.post('/crm/interacoes', payload);
            }

            toast.success(isEditMode ? 'Interação atualizada!' : 'Atendimento registrado!');
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Erro ao salvar interação:', error);
            const msg = error.response?.data?.message || 'Erro ao conectar com o servidor';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    // DB ComboBox fetchers
    const fetchClients = async (search) => {
        try {
            const res = await axios.get('/clients', { params: { search, limit: 10 } });
            return res.data.success ? res.data.data : [];
        } catch { return []; }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden bg-white border-slate-200/80 shadow-2xl rounded-3xl">
                <DialogHeader className="sr-only">
                    <DialogTitle>{isEditMode ? 'Editar Atendimento' : 'Novo Atendimento'}</DialogTitle>
                    <DialogDescription>Registro de interação com cliente.</DialogDescription>
                </DialogHeader>

                {/* Header */}
                <div className="px-8 pt-7 pb-5 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-sm transition-transform hover:scale-105">
                            <MessageCircle size={24} className="text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 tracking-tight">
                                {isEditMode ? 'Editar Atendimento' : 'Novo Atendimento'}
                            </h2>
                            <p className="text-xs font-medium text-slate-400 mt-0.5">Gestão de Canais e Interações</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    
                    {/* Cliente + Data/Hora */}
                    <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                                <User size={12} className="text-emerald-500" /> Cliente / Prospect *
                            </Label>
                            <DbComboBox
                                placeholder="Buscar cliente por nome ou código..."
                                value={clienteId ? { cli_codigo: clienteId, cli_nomred: clienteLabel } : null}
                                onChange={(val, item) => { setClienteId(val); setClienteLabel(item ? item.cli_nomred : ''); }}
                                fetchData={fetchClients}
                                labelKey="cli_nomred"
                                valueKey="cli_codigo"
                                className="bg-white border-slate-200 h-11 text-slate-800 font-bold rounded-xl"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                                    <Calendar size={12} className="text-emerald-500" /> Data
                                </Label>
                                <Input 
                                    type="date" 
                                    value={date} 
                                    onChange={(e) => setDate(e.target.value)}
                                    className="h-11 border-slate-200 rounded-xl font-medium focus:border-emerald-400"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                                    <Clock size={12} className="text-emerald-500" /> Hora
                                </Label>
                                <Input 
                                    type="time" 
                                    value={time} 
                                    onChange={(e) => setTime(e.target.value)}
                                    className="h-11 border-slate-200 rounded-xl font-medium focus:border-emerald-400"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Indústrias Abordadas — Toggle Buttons */}
                    <div className="space-y-2">
                        <Label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                            <Building2 size={12} className="text-emerald-500" /> Indústrias Abordadas
                            {industriasSelecionadas.size > 0 && (
                                <span className="ml-2 text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                    {industriasSelecionadas.size} selecionada{industriasSelecionadas.size > 1 ? 's' : ''}
                                </span>
                            )}
                        </Label>
                        <div className="flex flex-wrap gap-2">
                            {industriasList.map(ind => {
                                const isSelected = industriasSelecionadas.has(ind.for_codigo);
                                return (
                                    <button
                                        key={ind.for_codigo}
                                        type="button"
                                        onClick={() => toggleIndustria(ind.for_codigo)}
                                        className={cn(
                                            "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all duration-150 active:scale-95",
                                            isSelected
                                                ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20"
                                                : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50/50"
                                        )}
                                    >
                                        {isSelected && <Check size={12} strokeWidth={3} />}
                                        <Building2 size={12} />
                                        {ind.for_nomered || ind.for_nome}
                                    </button>
                                );
                            })}
                            {industriasList.length === 0 && !loading && (
                                <span className="text-xs text-slate-400 italic py-2">Nenhuma indústria disponível</span>
                            )}
                            {loading && (
                                <span className="text-xs text-slate-400 italic py-2 flex items-center gap-2">
                                    <Loader2 size={12} className="animate-spin" /> Carregando...
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Categorização */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-slate-600">Canal Atendimento *</Label>
                            <select 
                                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 bg-white focus:border-emerald-400 outline-none transition-all appearance-none"
                                value={canalId}
                                onChange={(e) => setCanalId(e.target.value)}
                            >
                                <option value="">Selecione...</option>
                                {canais.map(c => <option key={c.canal_id || c.id} value={c.canal_id || c.id}>{c.descricao}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-slate-600">Tipo Interação *</Label>
                            <select 
                                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 bg-white focus:border-emerald-400 outline-none transition-all appearance-none"
                                value={tipoId}
                                onChange={(e) => setTipoId(e.target.value)}
                            >
                                <option value="">Selecione...</option>
                                {tipos.map(t => <option key={t.tipo_id || t.id} value={t.tipo_id || t.id}>{t.descricao}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-slate-600">Resultado</Label>
                            <select 
                                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 bg-white focus:border-emerald-400 outline-none transition-all appearance-none"
                                value={resultadoId}
                                onChange={(e) => setResultadoId(e.target.value)}
                            >
                                <option value="">Selecione...</option>
                                {resultados.map(r => <option key={r.resultado_id || r.id} value={r.resultado_id || r.id}>{r.descricao}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Descrição */}
                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-slate-600 flex items-center justify-between">
                            <span>Resumo do Atendimento *</span>
                            <span className={cn("text-[10px]", descricao.length > 500 ? "text-red-500" : "text-slate-400")}>
                                {descricao.length} caracteres
                            </span>
                        </Label>
                        <textarea
                            className="w-full min-h-[100px] p-4 rounded-2xl border border-slate-200 text-sm font-medium text-slate-700 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 outline-none transition-all bg-white placeholder:text-slate-300 resize-none"
                            placeholder="Descreva o que foi conversado, pendências ou próximos passos..."
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <CheckCircle2 size={12} /> Salvar como Atendimento Finalizado
                    </p>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="rounded-xl border-slate-200 text-slate-600 font-bold h-11 px-6 hover:bg-slate-100 active:scale-95 transition-all"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving || loading}
                            className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-11 px-8 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95 group"
                        >
                            {saving ? <Loader2 size={18} className="animate-spin mr-2" /> : <Send size={18} className="mr-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />}
                            {isEditMode ? 'Atualizar Registro' : 'Registrar Atendimento'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default NovaInteracaoModal;
