import { useState, useEffect } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    Loader2, Target, Briefcase, Calendar, 
    User, Building2, CheckCircle2, TrendingUp,
    Rocket, MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import DbComboBox from '@/components/DbComboBox';
import axios from '@/lib/axios';

const NovaOportunidadeModal = ({ open, onClose, onSuccess, editData = null }) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const isEditMode = !!editData;

    // Form states
    const [clienteId, setClienteId] = useState(null);
    const [clienteLabel, setClienteLabel] = useState('');
    const [industriaId, setIndustriaId] = useState('');
    const [etapaId, setEtapaId] = useState('1');
    const [valor, setValor] = useState('');
    const [previsao, setPrevisao] = useState(new Date().toISOString().split('T')[0]);
    const [vendedorId, setVendedorId] = useState('');
    const [titulo, setTitulo] = useState('');

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

    // Lookups
    const [industrias, setIndustrias] = useState([]);
    const [vendedores, setVendedores] = useState([]);

    const fetchLookupData = async () => {
        setLoading(true);
        try {
            const [indRes, vendRes] = await Promise.all([
                axios.get('/suppliers?status=A'),
                axios.get('/crm/vendedores')
            ]);
            setIndustrias(indRes.data.success ? indRes.data.data : (Array.isArray(indRes.data) ? indRes.data : []));
            setVendedores(vendRes.data.success ? vendRes.data.data : (Array.isArray(vendRes.data) ? vendRes.data : []));
        } catch (error) {
            console.error('Erro ao buscar lookups:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchLookupData();
            if (editData) {
                setClienteId(editData.cli_codigo);
                setClienteLabel(editData.cli_nomred || '');
                setIndustriaId(editData.for_codigo || '');
                setEtapaId(editData.etapa_id?.toString() || '1');
                setValor(editData.valor_estimado || '');
                setTitulo(editData.titulo || '');
                if (editData.data_previsao) {
                    setPrevisao(new Date(editData.data_previsao).toISOString().split('T')[0]);
                }
                setVendedorId(editData.ven_codigo || '');
            } else {
                setClienteId(null); setClienteLabel('');
                setIndustriaId(''); setEtapaId('1');
                setValor(''); setTitulo('');
                setPrevisao(new Date().toISOString().split('T')[0]);
                
                // Tenta pegar o vendedor atual do sessionStorage
                try {
                    const u = JSON.parse(sessionStorage.getItem('user') || '{}');
                    if (u.ven_codigo) setVendedorId(u.ven_codigo);
                } catch {}
            }
        }
    }, [open, editData]);

    const handleSave = async () => {
        if (!clienteId || !titulo || !valor) {
            return toast.error('Preencha os campos obrigatórios (Cliente, Título e Valor)');
        }

        setSaving(true);
        try {
            const payload = {
                cli_codigo: clienteId,
                for_codigo: industriaId ? parseInt(industriaId) : null,
                etapa_id: parseInt(etapaId),
                valor_estimado: parseFloat(valor),
                data_previsao: previsao,
                ven_codigo: vendedorId ? parseInt(vendedorId) : null,
                titulo
            };

            if (isEditMode) {
                await axios.put(`/crm/oportunidades/${editData.oportunidade_id}`, payload);
            } else {
                await axios.post('/crm/oportunidades', payload);
            }

            toast.success(isEditMode ? 'Oportunidade atualizada!' : 'Oportunidade criada!');
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Erro ao salvar oportunidade:', error);
            toast.error('Erro ao conectar com o servidor');
        } finally {
            setSaving(false);
        }
    };

    const fetchClients = async (search) => {
        try {
            const res = await axios.get('/clients', { params: { search, limit: 10 } });
            return res.data.success ? res.data.data : [];
        } catch { return []; }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden bg-white border-slate-200/80 shadow-2xl rounded-3xl">
                <DialogHeader className="sr-only">
                    <DialogTitle>{isEditMode ? 'Editar Oportunidade' : 'Nova Oportunidade'}</DialogTitle>
                    <DialogDescription>Gerenciamento de oportunidade no pipeline comercial.</DialogDescription>
                </DialogHeader>

                {/* Header */}
                <div className="px-8 pt-7 pb-5 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-sm transition-transform hover:scale-105">
                            <Rocket size={24} className="text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 tracking-tight">
                                {isEditMode ? 'Editar Oportunidade' : 'Novo Negócio'}
                            </h2>
                            <p className="text-xs font-medium text-slate-400 mt-0.5">Gestão de Pipeline Comercial</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Título da Oportunidade */}
                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                            <Target size={12} className="text-emerald-500" /> Título da Oportunidade *
                        </Label>
                        <Input 
                            placeholder="Descreva brevemente o negócio (ex: Projeto Modernização 2026)"
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                            className="h-11 border-slate-200 rounded-xl font-bold text-slate-800 bg-slate-50/50 focus:bg-white focus:border-emerald-400 transition-all"
                        />
                    </div>

                    {/* Cliente Selection */}
                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                            <User size={12} className="text-emerald-500" /> Cliente / Prospect *
                        </Label>
                        <DbComboBox
                            placeholder="Buscar cliente..."
                            value={clienteId ? { cli_codigo: clienteId, cli_nomred: clienteLabel } : null}
                            onChange={(val, item) => { setClienteId(val); setClienteLabel(item ? item.cli_nomred : ''); }}
                            fetchData={fetchClients}
                            labelKey="cli_nomred"
                            valueKey="cli_codigo"
                            className="bg-white border-slate-200 h-11 text-slate-800 font-bold rounded-xl"
                        />
                    </div>

                    {/* Contexto: Indústria e Etapa */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                                <Building2 size={12} className="text-emerald-500" /> Indústria
                            </Label>
                            <select 
                                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 bg-white focus:border-emerald-400 outline-none transition-all appearance-none"
                                value={industriaId}
                                onChange={(e) => setIndustriaId(e.target.value)}
                            >
                                <option value="">Sem Indústria</option>
                                {industrias.map(ind => (
                                    <option key={ind.for_codigo} value={ind.for_codigo}>{ind.for_nomered || ind.for_nome}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                                <TrendingUp size={12} className="text-emerald-500" /> Etapa Atual
                            </Label>
                            <select 
                                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 bg-white focus:border-emerald-400 outline-none transition-all appearance-none"
                                value={etapaId}
                                onChange={(e) => setEtapaId(e.target.value)}
                            >
                                <option value="1">Prospecção</option>
                                <option value="2">Qualificação</option>
                                <option value="3">Proposta</option>
                                <option value="4">Negociação</option>
                                <option value="5">Fechamento</option>
                            </select>
                        </div>
                    </div>

                    {/* Financeiro: Valor e Previsão */}
                    <div className="grid grid-cols-2 gap-4 bg-slate-50/80 p-5 rounded-2xl border border-slate-100">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-slate-600">Valor Estimado</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                                <Input 
                                    type="text"
                                    placeholder="0,00"
                                    value={displayValue(valor)}
                                    onChange={(e) => setValor(maskCurrency(e.target.value))}
                                    className="h-11 pl-9 border-slate-200 rounded-xl font-black text-slate-800 focus:border-emerald-400"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-slate-600">Data Prevista</Label>
                            <Input 
                                type="date"
                                value={previsao}
                                onChange={(e) => setPrevisao(e.target.value)}
                                className="h-11 border-slate-200 rounded-xl font-bold text-slate-800 focus:border-emerald-400"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <CheckCircle2 size={12} /> Salvar no CRM Central
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
                            {saving ? <Loader2 size={18} className="animate-spin mr-2" /> : <Rocket size={18} className="mr-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />}
                            {isEditMode ? 'Atualizar Oportunidade' : 'Lançar no Pipeline'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default NovaOportunidadeModal;

