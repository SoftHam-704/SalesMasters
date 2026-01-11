import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
    User, Phone, MessageSquare, Building2, Loader2,
    Save, X, Calendar, Clock, Contact, Sparkles
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
                // Populate form for Edit or Prefill
                const d = new Date(editData.data_interacao || editData.data_hora);
                setDate(d.toISOString().split('T')[0]);
                setTime(d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));

                setClientId(editData.cli_codigo);
                setClientLabel(editData.cli_nomred || editData.cli_nome || '');
                setClientPhone(editData.cli_fone1 || '');

                setTipoId(String(editData.tipo_interacao_id || ''));
                setCanalId(String(editData.canal_id || ''));
                setResultadoId(String(editData.resultado_id || ''));

                // Extract Contato from description if it matches "[Contato: Name] Description"
                const desc = editData.descricao || '';
                const match = desc.match(/^\[Contato: (.*?)\] (.*)$/s);
                if (match) {
                    setContatoNome(match[1]);
                    setDescricao(match[2]);
                } else {
                    setContatoNome('');
                    setDescricao(desc);
                }

                setSelectedIndustries(editData.industrias || []);
            } else {
                resetForm();
            }
        }
    }, [open, editData]);

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
                fetch(`${NODE_API_URL}/api/crm/tipos`),
                fetch(`${NODE_API_URL}/api/crm/canais`),
                fetch(`${NODE_API_URL}/api/crm/resultados`),
                fetch(`${NODE_API_URL}/api/suppliers`)
            ]);

            const d1 = await tiposRes.json();
            const d2 = await canaisRes.json();
            const d3 = await resultadosRes.json();
            const d4 = await industriasRes.json();

            console.log('[CRM] Tipos loaded:', d1);
            console.log('[CRM] Canais loaded:', d2);
            console.log('[CRM] Resultados loaded:', d3);
            console.log('[CRM] Industrias loaded:', d4);

            // Handle both {success: true, data: [...]} and direct array response
            setTipos(d1.success ? d1.data : (Array.isArray(d1) ? d1 : []));
            setCanais(d2.success ? d2.data : (Array.isArray(d2) ? d2 : []));
            setResultados(d3.success ? d3.data : (Array.isArray(d3) ? d3 : []));
            setIndustriasList(d4.success ? d4.data : (Array.isArray(d4) ? d4 : []));
        } catch (error) {
            console.error('[CRM] Error loading lookup data:', error);
            toast.error('Erro ao carregar listas');
        } finally {
            setLoading(false);
        }
    };

    const fetchClients = async (search) => {
        try {
            const response = await fetch(`${NODE_API_URL}/api/clients?search=${encodeURIComponent(search || '')}&limit=10`);
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
            const payload = {
                cli_codigo: clientId,
                ven_codigo: 1, // TODO: Auth
                tipo_interacao_id: parseInt(tipoId),
                canal_id: parseInt(canalId),
                resultado_id: resultadoId ? parseInt(resultadoId) : null,
                descricao: contatoNome ? `[Contato: ${contatoNome}] ${descricao}` : descricao,
                industrias: selectedIndustries,
                data_hora: new Date(`${date}T${time}`).toISOString(),
            };

            const url = isEdit
                ? `${NODE_API_URL}/api/crm/interacoes/${editData.interacao_id}`
                : `${NODE_API_URL}/api/crm/interacoes`;

            const method = isEdit ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                toast.success(isEdit ? 'Interação atualizada!' : 'Interação registrada!');
                if (onSuccess) onSuccess();
                onClose();
            } else {
                const err = await response.json();
                toast.error(err.message || 'Erro ao salvar');
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro de conexão');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden" onPointerDownOutside={(e) => e.preventDefault()}>
                <DialogHeader className="sr-only">
                    <DialogTitle>Nova Interação</DialogTitle>
                    <DialogDescription>
                        Registro de novo histórico de contato com o cliente.
                    </DialogDescription>
                </DialogHeader>

                {/* Premium Header */}
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-5 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">{isEdit ? 'Editar Interação' : 'Nova Interação'}</h2>
                                <p className="text-blue-100 text-sm">
                                    {isEdit ? 'Atualize os detalhes do contato' : 'Registre o contato com o cliente'}
                                </p>
                            </div>
                        </div>
                        <Badge className="bg-white/20 text-white border-0">
                            <Sparkles className="w-3 h-3 mr-1" />
                            CRM
                        </Badge>
                    </div>
                </div>

                {loading ? (
                    <div className="p-10 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                ) : (
                    <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                        {/* Cliente Section */}
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                            <Label className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2 block">
                                <User className="w-3 h-3 inline mr-1" />
                                Cliente *
                            </Label>
                            <DbComboBox
                                placeholder="Digite para buscar o cliente..."
                                value={clientId ? { cli_codigo: clientId, cli_nomred: clientLabel } : null}
                                onChange={(val, item) => {
                                    setClientId(val);
                                    setClientLabel(item ? item.cli_nomred : '');
                                    setClientPhone(item ? item.cli_fone1 : '');
                                }}
                                fetchData={fetchClients}
                                labelKey="cli_nomred"
                                valueKey="cli_codigo"
                            />
                            {clientPhone && (
                                <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                                    <Phone className="w-3 h-3" />
                                    <span>{clientPhone}</span>
                                </div>
                            )}
                        </div>

                        {/* Data/Hora + Tipo Row */}
                        <div className="grid grid-cols-4 gap-4">
                            <div>
                                <Label className="text-xs font-semibold text-slate-600 mb-1 block">
                                    <Calendar className="w-3 h-3 inline mr-1" />
                                    Data
                                </Label>
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    className="h-10"
                                />
                            </div>
                            <div>
                                <Label className="text-xs font-semibold text-slate-600 mb-1 block">
                                    <Clock className="w-3 h-3 inline mr-1" />
                                    Horário
                                </Label>
                                <Input
                                    type="time"
                                    value={time}
                                    onChange={e => setTime(e.target.value)}
                                    className="h-10"
                                />
                            </div>
                            <div>
                                <Label className="text-xs font-semibold text-slate-600 mb-1 block">Canal *</Label>
                                <Select value={canalId} onValueChange={setCanalId}>
                                    <SelectTrigger className="h-10 bg-white">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {canais.map(c => (
                                            <SelectItem key={c.id} value={String(c.id)}>{c.descricao}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs font-semibold text-slate-600 mb-1 block">Tipo *</Label>
                                <Select value={tipoId} onValueChange={setTipoId}>
                                    <SelectTrigger className="h-10 bg-white">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {tipos.map(t => (
                                            <SelectItem key={t.id} value={String(t.id)}>{t.descricao}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Contato + Status Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-xs font-semibold text-slate-600 mb-1 block">
                                    <Contact className="w-3 h-3 inline mr-1" />
                                    Pessoa de Contato
                                </Label>
                                <Input
                                    value={contatoNome}
                                    onChange={e => setContatoNome(e.target.value)}
                                    placeholder="Nome do contato na empresa"
                                    className="h-10"
                                />
                            </div>
                            <div>
                                <Label className="text-xs font-semibold text-slate-600 mb-1 block">Resultado</Label>
                                <Select value={resultadoId} onValueChange={setResultadoId}>
                                    <SelectTrigger className="h-10 bg-white">
                                        <SelectValue placeholder="Em aberto" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {resultados.map(r => (
                                            <SelectItem key={r.id} value={String(r.id)}>{r.descricao}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Indústrias */}
                        <div>
                            <Label className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-blue-500" />
                                Indústrias Relacionadas (Ativas)
                            </Label>
                            <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-xl border-2 border-slate-100 max-h-48 overflow-y-auto shadow-inner">
                                {industriasList.map((ind) => (
                                    <Button
                                        key={ind.for_codigo}
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => toggleIndustria(ind.for_codigo)}
                                        className={cn(
                                            "h-8 text-xs font-medium transition-all duration-200",
                                            selectedIndustries.includes(ind.for_codigo)
                                                ? "bg-blue-600 text-white border-blue-600 shadow-md transform scale-105"
                                                : "bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:bg-blue-50"
                                        )}
                                    >
                                        {ind.nomeReduzido || ind.razaoSocial}
                                    </Button>
                                ))}
                            </div>
                            {selectedIndustries.length > 0 && (
                                <p className="text-[11px] font-semibold text-blue-600 mt-2 flex items-center">
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    {selectedIndustries.length} indústria(s) selecionada(s)
                                </p>
                            )}
                        </div>

                        {/* Descrição */}
                        <div>
                            <Label className="text-xs font-semibold text-slate-600 mb-1 block">
                                Assunto Tratado
                            </Label>
                            <Textarea
                                value={descricao}
                                onChange={e => setDescricao(e.target.value)}
                                placeholder="Descreva o que foi conversado, próximos passos, observações..."
                                className="min-h-[100px] resize-none"
                            />
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="p-4 bg-slate-50 border-t flex justify-between items-center">
                    <p className="text-xs text-slate-400">* Campos obrigatórios</p>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose} className="text-slate-600">
                            <X className="w-4 h-4 mr-2" />
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving || loading}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 min-w-[140px]"
                        >
                            {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Salvar Interação
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default NovaInteracaoModal;
