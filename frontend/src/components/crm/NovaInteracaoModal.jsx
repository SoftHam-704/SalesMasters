import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    Loader2, Shield, Calendar, Clock, MessageCircle, Zap, Target, User, Phone
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import DbComboBox from '@/components/DbComboBox';
import { NODE_API_URL } from '../../utils/apiConfig';

const NovaInteracaoModal = ({ open, onClose, onSuccess, editData = null }) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const isEdit = !!editData?.interacao_id;

    // Form state
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    const [clientId, setClientId] = useState(null);
    const [clientLabel, setClientLabel] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [tipoId, setTipoId] = useState('');
    const [canalId, setCanalId] = useState('');
    const [resultadoId, setResultadoId] = useState('');
    const [contatoNome, setContatoNome] = useState('');
    const [descricao, setDescricao] = useState('');
    const [selectedIndustries, setSelectedIndustries] = useState([]);

    // Lookups
    const [tipos, setTipos] = useState([]);
    const [canais, setCanais] = useState([]);
    const [resultados, setResultados] = useState([]);
    const [industriasList, setIndustriasList] = useState([]);

    useEffect(() => {
        if (open) {
            fetchLookupData();
            if (editData) {
                // Ensure we have a valid date from source or fallback to now
                const dateSource = editData.data_interacao || editData.data_hora;
                const d = (dateSource && !isNaN(new Date(dateSource).getTime()))
                    ? new Date(dateSource)
                    : new Date();

                setDate(d.toISOString().split('T')[0]);
                setTime(d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));

                setClientId(editData.cli_codigo || null);
                setClientLabel(editData.cli_nomred || editData.cli_nome || '');
                setClientPhone(editData.cli_fone1 || '');
                setTipoId(String(editData.tipo_interacao_id || ''));
                setCanalId(String(editData.canal_id || ''));
                setResultadoId(String(editData.resultado_id || ''));
                const desc = editData.descricao || '';
                const match = desc.match(/^\[Contato: (.*?)\] (.*)$/s);
                if (match) { setContatoNome(match[1]); setDescricao(match[2]); }
                else { setContatoNome(''); setDescricao(desc); }
                setSelectedIndustries(editData.industrias || []);
            } else { resetForm(); }
        }
    }, [open, editData]);

    const resetForm = () => {
        setDate(new Date().toISOString().split('T')[0]);
        setTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
        setClientId(null); setClientLabel(''); setClientPhone(''); setTipoId(''); setCanalId('');
        setResultadoId(''); setContatoNome(''); setDescricao(''); setSelectedIndustries([]);
    };

    const fetchLookupData = async () => {
        setLoading(true);
        try {
            const [tiposRes, canaisRes, resultadosRes, industriasRes] = await Promise.all([
                fetch(`${NODE_API_URL}/api/crm/tipos`),
                fetch(`${NODE_API_URL}/api/crm/canais`),
                fetch(`${NODE_API_URL}/api/crm/resultados`),
                fetch(`${NODE_API_URL}/api/suppliers?status=A`)
            ]);
            const d1 = await tiposRes.json();
            const d2 = await canaisRes.json();
            const d3 = await resultadosRes.json();
            const d4 = await industriasRes.json();
            setTipos(d1.success ? d1.data : d1);
            setCanais(d2.success ? d2.data : d2);
            setResultados(d3.success ? d3.data : d3);
            setIndustriasList(d4.success ? d4.data : d4);
        } catch (error) { toast.error('Falha de uplink com auxiliares'); }
        finally { setLoading(false); }
    };

    const fetchClients = async (search) => {
        try {
            const response = await fetch(`${NODE_API_URL}/api/clients?search=${encodeURIComponent(search || '')}&limit=10`);
            const data = await response.json();
            return data.success ? data.data : [];
        } catch (error) { return []; }
    };

    const handleSave = async () => {
        if (!clientId || !canalId || !tipoId) return toast.error('Campos obrigatórios ausentes');
        setSaving(true);
        try {
            const payload = {
                cli_codigo: clientId,
                ven_codigo: JSON.parse(sessionStorage.getItem('user'))?.id || 1,
                tipo_interacao_id: parseInt(tipoId),
                canal_id: parseInt(canalId),
                resultado_id: resultadoId ? parseInt(resultadoId) : null,
                descricao: contatoNome ? `[Contato: ${contatoNome}] ${descricao}` : descricao,
                industrias: selectedIndustries,
                data_hora: new Date(`${date}T${time}`).toISOString(),
            };
            const url = isEdit ? `${NODE_API_URL}/api/crm/interacoes/${editData.interacao_id}` : `${NODE_API_URL}/api/crm/interacoes`;
            const method = isEdit ? 'PUT' : 'POST';
            const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (response.ok) { toast.success('Operação registrada no log'); onSuccess?.(); onClose(); }
            else { toast.error('Falha na transmissão'); }
        } catch (error) { toast.error('Erro de protocolo'); }
        finally { setSaving(false); }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden bg-white border-slate-200 shadow-2xl rounded-2xl">
                <DialogHeader className="sr-only">
                    <DialogTitle>{isEdit ? 'Editar Operação' : 'Nova Operação'}</DialogTitle>
                    <DialogDescription>Formulário de registro tático de CRM.</DialogDescription>
                </DialogHeader>

                {/* High-Contrast Professional Header */}
                <div className="bg-[#003366] p-6 flex justify-between items-center border-b border-blue-800">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white border border-white/20">
                            <Shield size={26} />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest block mb-0.5">MÓDULO DE OPERAÇÕES</span>
                            <h2 className="text-xl font-bold text-white uppercase tracking-tight">{isEdit ? 'Editar Registro' : 'Nova Interação'}</h2>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="p-32 flex flex-col items-center justify-center gap-6 bg-white">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-widest">Carregando dados...</span>
                    </div>
                ) : (
                    <div className="p-8 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar bg-white">

                        {/* Section 1: Identification */}
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-6">
                            <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-4">
                                <User size={18} className="text-blue-600" />
                                <h3 className="text-sm font-black text-slate-900 uppercase">Identificação do Alvo</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-900">Cliente / Prospect *</Label>
                                    <DbComboBox
                                        placeholder="Pesquisar por nome ou código..."
                                        value={clientId ? { cli_codigo: clientId, cli_nomred: clientLabel } : null}
                                        onChange={(val, item) => {
                                            setClientId(val);
                                            setClientLabel(item ? item.cli_nomred : '');
                                            setClientPhone(item ? item.cli_fone1 : '');
                                        }}
                                        fetchData={fetchClients}
                                        labelKey="cli_nomred"
                                        valueKey="cli_codigo"
                                        className="bg-white border-slate-400 hover:border-blue-600 transition-colors h-12 text-slate-900 font-bold"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-slate-900">Data *</Label>
                                        <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-12 border-slate-400 text-slate-900 font-bold focus:border-blue-600" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-slate-900">Hora *</Label>
                                        <Input type="time" value={time} onChange={e => setTime(e.target.value)} className="h-12 border-slate-400 text-slate-900 font-bold focus:border-blue-600" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Strategy */}
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-6">
                            <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-4">
                                <Zap size={18} className="text-amber-600" />
                                <h3 className="text-sm font-black text-slate-900 uppercase">Protocolos Táticos</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-900">Canal de Contato *</Label>
                                    <Select value={canalId} onValueChange={setCanalId}>
                                        <SelectTrigger className="h-12 border-slate-400 text-slate-900 font-bold bg-white">
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {canais.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.descricao}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-900">Tipo de Ação *</Label>
                                    <Select value={tipoId} onValueChange={setTipoId}>
                                        <SelectTrigger className="h-12 border-slate-400 text-slate-900 font-bold bg-white">
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {tipos.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.descricao}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-900">Desfecho / Status *</Label>
                                    <Select value={resultadoId} onValueChange={setResultadoId}>
                                        <SelectTrigger className="h-12 border-slate-400 text-slate-900 font-bold bg-white">
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {resultados.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.descricao}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Descriptive */}
                        <div className="space-y-2">
                            <Label className="text-sm font-black text-slate-900 uppercase">Resumo da Interação / Próximos Passos</Label>
                            <Textarea
                                value={descricao}
                                onChange={e => setDescricao(e.target.value)}
                                placeholder="Descreva aqui os detalhes da conversa..."
                                className="min-h-[140px] border-slate-400 text-slate-900 font-medium p-4 focus:border-blue-600 bg-white"
                            />
                        </div>

                        {/* Section 4: Industries */}
                        <div className="space-y-4">
                            <Label className="text-sm font-black text-slate-900 uppercase">Indústrias Envolvidas</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {industriasList.map((ind) => {
                                    const isSelected = selectedIndustries.includes(ind.for_codigo);
                                    const displayName = ind.for_nomered || ind.for_nome || `Ind. ${ind.for_codigo}`;

                                    return (
                                        <button
                                            key={ind.for_codigo}
                                            type="button"
                                            onClick={() => {
                                                if (isSelected) setSelectedIndustries(selectedIndustries.filter(i => i !== ind.for_codigo));
                                                else setSelectedIndustries([...selectedIndustries, ind.for_codigo]);
                                            }}
                                            className={cn(
                                                "p-3 rounded-xl border-2 font-black text-[10px] uppercase transition-all shadow-sm",
                                                isSelected
                                                    ? "bg-blue-700 border-blue-900 text-white shadow-md ring-2 ring-blue-400/30"
                                                    : "bg-slate-200 border-slate-400 text-slate-900 hover:bg-slate-300 hover:border-slate-500"
                                            )}
                                        >
                                            <span className="truncate w-full block">{displayName}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* VISIBLE ACCESSIBLE FOOTER */}
                <div className="p-6 bg-slate-100 border-t-2 border-slate-200 flex justify-end gap-6">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="border-slate-400 text-slate-900 font-bold uppercase text-xs px-8 hover:bg-slate-200"
                    >
                        CANCELAR
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="bg-blue-600 hover:bg-blue-800 text-white font-black uppercase text-xs px-12 h-14 shadow-xl"
                    >
                        {saving ? <Loader2 className="animate-spin" /> : 'CONCLUIR E SALVAR LOG'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default NovaInteracaoModal;
