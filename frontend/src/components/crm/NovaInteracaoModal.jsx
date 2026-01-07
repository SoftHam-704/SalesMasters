import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    User, Phone, MessageSquare, Building2,
    Save, X, Calendar, Clock, Contact
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import DbComboBox from '@/components/DbComboBox'; // Using standardized combo
import InputField from '@/components/InputField';

const NovaInteracaoModal = ({ open, onClose, onSuccess, prefill = null }) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state matching Legacy UI
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));

    const [clientId, setClientId] = useState(null);
    const [clientLabel, setClientLabel] = useState('');
    const [clientPhone, setClientPhone] = useState(''); // Read-only

    const [tipoId, setTipoId] = useState(''); // Tipo Visita
    const [canalId, setCanalId] = useState(''); // Forma de Interação
    const [resultadoId, setResultadoId] = useState(''); // Status

    const [contatoNome, setContatoNome] = useState(''); // Pessoa de Contato
    const [descricao, setDescricao] = useState(''); // Assunto tratado

    // Multi-select for Industries (simplified for now as array of IDs)
    const [selectedIndustries, setSelectedIndustries] = useState([]);

    // Lookups
    const [tipos, setTipos] = useState([]);
    const [canais, setCanais] = useState([]);
    const [resultados, setResultados] = useState([]);
    const [industriasList, setIndustriasList] = useState([]);

    // Fetch Lookup Data
    useEffect(() => {
        if (open) {
            fetchLookupData();
            // Reset or Prefill
            if (prefill) {
                setClientId(prefill.cli_codigo);
                setClientLabel(prefill.cli_nomred || prefill.cli_nome || '');
                setClientPhone(prefill.cli_fone1 || '');
                setDescricao(prefill.descricao || '');
                // Try to map other fields if they exist in prefill
            } else {
                resetForm();
            }
        }
    }, [open, prefill]);

    const resetForm = () => {
        setDate(new Date().toISOString().split('T')[0]);
        setTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
        setClientId(null);
        setClientLabel('');
        setClientPhone('');
        setTipoId('');
        setCanalId('');
        setResultadoId('');
        setContatoNome('');
        setDescricao('');
        setSelectedIndustries([]);
    };

    const fetchLookupData = async () => {
        setLoading(true);
        try {
            const [tiposRes, canaisRes, resultadosRes, industriasRes] = await Promise.all([
                fetch('http://localhost:3005/api/crm/tipos'),
                fetch('http://localhost:3005/api/crm/canais'),
                fetch('http://localhost:3005/api/crm/resultados'),
                fetch('http://localhost:3005/api/suppliers')
            ]);

            const d1 = await tiposRes.json();
            const d2 = await canaisRes.json();
            const d3 = await resultadosRes.json();
            const d4 = await industriasRes.json();

            if (d1.success) setTipos(d1.data);
            if (d2.success) setCanais(d2.data);
            // Sort outcomes: Em Aberto/Neutro first? Usually they are ordered by 'ordem'
            if (d3.success) setResultados(d3.data);
            if (d4.success) setIndustriasList(d4.data);

        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar listas');
        } finally {
            setLoading(false);
        }
    };

    const fetchClients = async (search) => {
        try {
            const response = await fetch(`http://localhost:3005/api/clients?search=${encodeURIComponent(search || '')}&limit=10`);
            const data = await response.json();
            return data.success ? data.data : [];
        } catch (error) {
            console.error(error);
            return [];
        }
    };

    const toggleIndustria = (id) => {
        if (selectedIndustries.includes(id)) {
            setSelectedIndustries(selectedIndustries.filter(i => i !== id));
        } else {
            setSelectedIndustries([...selectedIndustries, id]);
        }
    };

    const handleSave = async () => {
        if (!clientId) return toast.error('Informe o Cliente');
        if (!canalId) return toast.error('Informe a Forma de Interação');
        if (!tipoId) return toast.error('Informe o Tipo de Visita');

        setSaving(true);
        try {
            // Combine Date + Time
            // For now, backend expects just 'data_hora' or timestamp.
            // We will construct it.
            const dataHora = `${date} ${time}:00`;

            // Prepare Payload
            const payload = {
                cli_codigo: clientId,
                ven_codigo: 1, // TODO: Auth
                tipo_interacao_id: tipoId,
                canal_id: canalId,
                resultado_id: resultadoId || null,
                descricao: `[Contato: ${contatoNome || 'N/A'}] ${descricao}`, // Prepending Contact Name as backend might not have column yet
                industrias: selectedIndustries,
                // data_hora: dataHora // Backend doesn't support custom date yet in INSERT? Standard uses NOW().
                // TODO: Update backend to accept custom date if strictly required. 
                // For now, we assume interaction is just happening or recently happened.
            };

            const response = await fetch('http://localhost:3005/api/crm/interacoes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                toast.success('Interação Salva!');
                if (onSuccess) onSuccess();
                onClose();
            } else {
                toast.error('Erro ao salvar');
            }
        } catch (error) {
            toast.error('Erro de conexão');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden rounded-xl bg-white">
                {/* Header Clean - Centered Title like Legacy */}
                <div className="p-4 border-b border-slate-100 text-center relative bg-slate-50/50">
                    <h2 className="text-xl font-bold text-red-800 uppercase tracking-wide" style={{ fontFamily: 'serif' }}>
                        {clientLabel || 'Nova Interação'}
                    </h2>
                    <Button variant="ghost" size="icon" onClick={onClose} className="absolute right-2 top-2 text-slate-400 hover:text-red-500">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="p-6 space-y-4 bg-slate-50/30">
                    {/* Row 1: Date, Time, Interaction Form, Visit Type, Status */}
                    <div className="grid grid-cols-12 gap-4">
                        {/* Data */}
                        <div className="col-span-3">
                            <Label className="text-xs font-semibold text-slate-500">Data</Label>
                            <div className="relative">
                                <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-9 text-sm" />
                            </div>
                        </div>
                        {/* Horário */}
                        <div className="col-span-2">
                            <Label className="text-xs font-semibold text-slate-500">Horário</Label>
                            <div className="relative">
                                <Input type="time" value={time} onChange={e => setTime(e.target.value)} className="h-9 text-sm" />
                            </div>
                        </div>
                        {/* Forma de Interação (Canal) */}
                        <div className="col-span-3">
                            <Label className="text-xs font-semibold text-slate-500">Forma de interação</Label>
                            <Select value={canalId} onValueChange={setCanalId}>
                                <SelectTrigger className="h-9 bg-white border-blue-200">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {canais.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.descricao}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Tipo visita */}
                        <div className="col-span-2">
                            <Label className="text-xs font-semibold text-slate-500">Tipo visita</Label>
                            <Select value={tipoId} onValueChange={setTipoId}>
                                <SelectTrigger className="h-9 bg-white">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {tipos.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.descricao}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Status */}
                        <div className="col-span-2">
                            <Label className="text-xs font-semibold text-slate-500">Status</Label>
                            <Select value={resultadoId} onValueChange={setResultadoId}>
                                <SelectTrigger className="h-9 bg-white">
                                    <SelectValue placeholder="Em aberto" />
                                </SelectTrigger>
                                <SelectContent>
                                    {resultados.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.descricao}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Row 2: Industries (Dropdown) & Client Contact */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Industries - Using a Scroll Area for multiple selection simulating the legacy look but better */}
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-500">Indústrias</Label>
                            <div className="border rounded-md bg-white h-24 overflow-y-auto p-2">
                                <div className="grid grid-cols-2 gap-2">
                                    {industriasList.map((ind) => (
                                        <div key={ind.for_codigo} className="flex items-center gap-2">
                                            <Checkbox
                                                id={`ind-${ind.for_codigo}`}
                                                checked={selectedIndustries.includes(ind.for_codigo)}
                                                onCheckedChange={() => toggleIndustria(ind.for_codigo)}
                                                className="w-3 h-3"
                                            />
                                            <label htmlFor={`ind-${ind.for_codigo}`} className="text-xs text-slate-600 truncate cursor-pointer select-none">
                                                {ind.nomeReduzido || ind.razaoSocial}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Client (if not prefilled, allows search) */}
                            <div>
                                <DbComboBox
                                    label="Cliente"
                                    placeholder="Busque o cliente..."
                                    value={clientId ? { cli_codigo: clientId, cli_nomred: clientLabel } : null}
                                    onChange={(val, item) => {
                                        setClientId(val);
                                        setClientLabel(item ? item.cli_nomred : '');
                                        setClientPhone(item ? item.cli_fone1 : '');
                                    }}
                                    fetchData={fetchClients}
                                    labelKey="cli_nomred"
                                    valueKey="cli_codigo"
                                    className="h-9"
                                />
                            </div>

                            {/* Contact Person */}
                            <div>
                                <Label className="text-xs font-semibold text-slate-500">Pessoa de contato no cliente</Label>
                                <Input
                                    value={contatoNome}
                                    onChange={e => setContatoNome(e.target.value)}
                                    placeholder="Ex: FUMINHO"
                                    className="h-9 bg-white font-semibold uppercase text-slate-700"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Telefone (Read Only) */}
                    <div>
                        <Label className="text-xs font-semibold text-slate-500">Telefone(s)</Label>
                        <div className="p-2 bg-slate-100 rounded border border-slate-200 text-sm font-medium text-slate-700">
                            {clientPhone || 'Não informado'}
                        </div>
                    </div>

                    {/* Assunto Start */}
                    <div className="flex-1 flex flex-col min-h-[120px]">
                        <Label className="text-xs font-semibold text-slate-500 mb-1">Assunto tratado</Label>
                        <Textarea
                            value={descricao}
                            onChange={e => setDescricao(e.target.value)}
                            placeholder="Descreva o que foi conversado..."
                            className="flex-1 resize-none bg-white p-3 text-sm leading-relaxed uppercase"
                            style={{ minHeight: '120px' }}
                        />
                    </div>
                </div>

                <DialogFooter className="p-3 bg-slate-100 border-t flex justify-start gap-3">
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Salvar</>}
                    </Button>
                    <Button variant="outline" onClick={onClose} className="text-red-600 border-red-200 hover:bg-red-50">
                        <X className="w-4 h-4 mr-2" /> Cancelar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default NovaInteracaoModal;
