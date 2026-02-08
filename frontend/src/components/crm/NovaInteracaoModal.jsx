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
    Loader2, Shield, Calendar, Clock, MessageCircle, Zap, Target
} from 'lucide-react';
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
                const d = new Date(editData.data_interacao || editData.data_hora);
                setDate(d.toISOString().split('T')[0]);
                setTime(d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
                setClientId(editData.cli_codigo);
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
                fetch(`${NODE_API_URL}/api/suppliers`)
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

                {/* Refined Header */}
                <div className="bg-slate-900 p-6 flex justify-between items-center shadow-md z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                            <Shield size={20} />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-0.5">Operações CRM</span>
                            <h2 className="text-lg font-black uppercase tracking-tight text-white">{isEdit ? 'Modificar Registro' : 'Nova Interação'}</h2>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="p-20 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sincronizando log...</span>
                    </div>
                ) : (
                    <div className="p-8 space-y-7 max-h-[70vh] overflow-y-auto custom-scrollbar bg-slate-50/30">
                        {/* Target Selection */}
                        <div className="space-y-3">
                            <Label className="tactical-label">Alvo Principal (Cliente)</Label>
                            <DbComboBox
                                placeholder="Identificar Alvo..."
                                value={clientId ? { cli_codigo: clientId, cli_nomred: clientLabel } : null}
                                onChange={(val, item) => {
                                    setClientId(val);
                                    setClientLabel(item ? item.cli_nomred : '');
                                    setClientPhone(item ? item.cli_fone1 : '');
                                }}
                                fetchData={fetchClients}
                                labelKey="cli_nomred"
                                valueKey="cli_codigo"
                                className="bg-white border-slate-200 text-slate-900 h-11 shadow-sm"
                            />
                        </div>

                        {/* Protocols & Timeline */}
                        <div className="grid grid-cols-5 gap-4">
                            <div className="space-y-2">
                                <Label className="tactical-label">Data</Label>
                                <div className="relative">
                                    <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-11 bg-white border-slate-200 text-xs text-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 shadow-sm" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="tactical-label">Hora</Label>
                                <Input type="time" value={time} onChange={e => setTime(e.target.value)} className="h-11 bg-white border-slate-200 text-xs text-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 shadow-sm" />
                            </div>
                            <div className="space-y-2">
                                <Label className="tactical-label">Canal</Label>
                                <Select value={canalId} onValueChange={setCanalId}>
                                    <SelectTrigger className="h-11 bg-white border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-blue-500/20 shadow-sm">
                                        <SelectValue placeholder="Canal" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-slate-200 text-slate-700">
                                        {canais.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.descricao}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="tactical-label">Tipo</Label>
                                <Select value={tipoId} onValueChange={setTipoId}>
                                    <SelectTrigger className="h-11 bg-white border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-blue-500/20 shadow-sm">
                                        <SelectValue placeholder="Tipo" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-slate-200 text-slate-700">
                                        {tipos.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.descricao}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="tactical-label">Situação</Label>
                                <Select value={resultadoId} onValueChange={setResultadoId}>
                                    <SelectTrigger className="h-11 bg-white border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-blue-500/20 shadow-sm">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-slate-200 text-slate-700">
                                        {resultados.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.descricao}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-3">
                            <Label className="tactical-label">Log de Comunicação</Label>
                            <Textarea
                                value={descricao}
                                onChange={e => setDescricao(e.target.value)}
                                placeholder="Descreva os pontos de contato e decisões táticas..."
                                className="min-h-[140px] bg-white border-slate-200 text-slate-700 rounded-xl resize-none focus:ring-2 focus:ring-blue-500/20 shadow-sm p-4 placeholder:text-slate-400"
                            />
                        </div>

                        {/* Segmentation */}
                        <div className="space-y-3">
                            <Label className="tactical-label">Segmentos de Indústria</Label>
                            <div className="flex flex-wrap gap-2 p-5 bg-white border border-slate-200 rounded-2xl max-h-48 overflow-y-auto custom-scrollbar shadow-inner">
                                {industriasList.map((ind) => {
                                    const isSelected = selectedIndustries.includes(ind.for_codigo);
                                    return (
                                        <button
                                            key={ind.for_codigo}
                                            type="button"
                                            onClick={() => {
                                                if (isSelected) setSelectedIndustries(selectedIndustries.filter(i => i !== ind.for_codigo));
                                                else setSelectedIndustries([...selectedIndustries, ind.for_codigo]);
                                            }}
                                            className={cn(
                                                "px-4 py-2 text-[10px] font-bold uppercase tracking-tight rounded-xl border transition-all shadow-sm",
                                                isSelected
                                                    ? "bg-blue-600 border-blue-600 text-white shadow-blue-500/20"
                                                    : "bg-white border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600"
                                            )}
                                        >
                                            {ind.nomeReduzido || ind.razaoSocial}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Controls */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-4 px-8">
                    <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-slate-600 uppercase text-[10px] font-bold px-6">
                        Descartar
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest px-12 h-12 rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
                    >
                        {saving ? <Loader2 className="animate-spin" /> : 'Sincronizar Log'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default NovaInteracaoModal;
