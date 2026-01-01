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
    Save, X, Search, Loader2, Check
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";

const NovaInteracaoModal = ({ open, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [form, setForm] = useState({
        cli_codigo: '',
        tipo_interacao_id: '',
        canal_id: '',
        resultado_id: '',
        descricao: '',
        industrias: []
    });

    // Lookup data
    const [tipos, setTipos] = useState([]);
    const [canais, setCanais] = useState([]);
    const [resultados, setResultados] = useState([]);
    const [industrias, setIndustrias] = useState([]);

    // Client search
    const [clientSearch, setClientSearch] = useState('');
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [searchingClients, setSearchingClients] = useState(false);

    // Fetch lookup data when modal opens
    useEffect(() => {
        if (open) {
            fetchLookupData();
            resetForm();
        }
    }, [open]);

    const fetchLookupData = async () => {
        setLoading(true);
        try {
            const [tiposRes, canaisRes, resultadosRes, industriasRes] = await Promise.all([
                fetch('http://localhost:3005/api/crm/tipos'),
                fetch('http://localhost:3005/api/crm/canais'),
                fetch('http://localhost:3005/api/crm/resultados'),
                fetch('http://localhost:3005/api/suppliers')
            ]);

            const tiposData = await tiposRes.json();
            const canaisData = await canaisRes.json();
            const resultadosData = await resultadosRes.json();
            const industriasData = await industriasRes.json();

            if (tiposData.success) setTipos(tiposData.data);
            if (canaisData.success) setCanais(canaisData.data);
            if (resultadosData.success) setResultados(resultadosData.data);
            if (industriasData.success) setIndustrias(industriasData.data);
        } catch (error) {
            console.error('Error fetching lookup data:', error);
            toast.error('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setForm({
            cli_codigo: '',
            tipo_interacao_id: '',
            canal_id: '',
            resultado_id: '',
            descricao: '',
            industrias: []
        });
        setClientSearch('');
        setSelectedClient(null);
        setClients([]);
    };

    const searchClients = async () => {
        // Allow empty search to list top 10 active clients
        // if (clientSearch.length < 2) return;

        setSearchingClients(true);
        try {
            const response = await fetch(`http://localhost:3005/api/clients?search=${encodeURIComponent(clientSearch)}&limit=10`);
            const data = await response.json();
            if (data.success) {
                setClients(data.data);
            }
        } catch (error) {
            console.error('Error searching clients:', error);
        } finally {
            setSearchingClients(false);
        }
    };

    const selectClient = (client) => {
        setSelectedClient(client);
        setForm({ ...form, cli_codigo: client.cli_codigo });
        setClientSearch(client.cli_nomred || client.cli_nome);
        setClients([]);
    };

    const toggleIndustria = (forCodigo) => {
        const current = form.industrias;
        if (current.includes(forCodigo)) {
            setForm({ ...form, industrias: current.filter(id => id !== forCodigo) });
        } else {
            setForm({ ...form, industrias: [...current, forCodigo] });
        }
    };

    const handleSave = async () => {
        // Validation
        if (!form.cli_codigo) {
            toast.error('Selecione um cliente');
            return;
        }
        if (!form.tipo_interacao_id) {
            toast.error('Selecione o tipo de interação');
            return;
        }

        setSaving(true);
        try {
            const response = await fetch('http://localhost:3005/api/crm/interacoes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    ven_codigo: 1 // TODO: Get from auth context
                })
            });

            const result = await response.json();

            if (result.success) {
                toast.success('Interação registrada com sucesso!');
                if (onSuccess) onSuccess();
                onClose();
            } else {
                throw new Error(result.message || 'Erro ao salvar');
            }
        } catch (error) {
            console.error('Error saving interaction:', error);
            toast.error(`Erro: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden border-0 shadow-2xl rounded-2xl">
                {/* Premium Header */}
                <DialogHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 p-5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
                    <DialogTitle className="flex items-center gap-3 text-white relative z-10">
                        <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="font-bold text-lg">Nova Interação</span>
                            <p className="text-blue-100 text-xs font-medium mt-0.5">Registre o contato com o cliente</p>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                ) : (
                    <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                        {/* Client Search */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <User className="w-4 h-4 text-blue-500" />
                                Cliente *
                            </Label>
                            <div className="relative">
                                <Input
                                    placeholder="Digite o nome do cliente..."
                                    value={clientSearch}
                                    onChange={(e) => setClientSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && searchClients()}
                                    className="pr-10"
                                />
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="absolute right-1 top-1/2 -translate-y-1/2"
                                    onClick={searchClients}
                                    disabled={searchingClients}
                                >
                                    {searchingClients ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Search className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>

                            {/* Client search results */}
                            {clients.length > 0 && (
                                <div className="border rounded-lg bg-white shadow-lg max-h-40 overflow-y-auto">
                                    {clients.map((client) => (
                                        <div
                                            key={client.cli_codigo}
                                            onClick={() => selectClient(client)}
                                            className="p-2 hover:bg-blue-50 cursor-pointer border-b last:border-0 text-sm"
                                        >
                                            <span className="font-medium">{client.cli_nomred || client.cli_nome}</span>
                                            {client.cli_cidade && (
                                                <span className="text-slate-400 ml-2">- {client.cli_cidade}/{client.cli_uf}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {selectedClient && (
                                <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 p-2 rounded-lg">
                                    <Check className="w-4 h-4" />
                                    Cliente selecionado: <strong>{selectedClient.cli_nomred || selectedClient.cli_nome}</strong>
                                </div>
                            )}
                        </div>

                        {/* Type and Channel - Side by Side */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-blue-500" />
                                    Tipo de Interação *
                                </Label>
                                <Select
                                    value={form.tipo_interacao_id}
                                    onValueChange={(v) => setForm({ ...form, tipo_interacao_id: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {tipos.map((tipo) => (
                                            <SelectItem key={tipo.id} value={String(tipo.id)}>
                                                {tipo.descricao}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-blue-500" />
                                    Canal
                                </Label>
                                <Select
                                    value={form.canal_id}
                                    onValueChange={(v) => setForm({ ...form, canal_id: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {canais.map((canal) => (
                                            <SelectItem key={canal.id} value={String(canal.id)}>
                                                {canal.descricao}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Result */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">Resultado</Label>
                            <Select
                                value={form.resultado_id}
                                onValueChange={(v) => setForm({ ...form, resultado_id: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o resultado..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {resultados.map((resultado) => (
                                        <SelectItem key={resultado.id} value={String(resultado.id)}>
                                            {resultado.descricao}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Industries */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-blue-500" />
                                Indústrias Relacionadas
                            </Label>
                            <ScrollArea className="h-32 border rounded-lg p-2">
                                <div className="grid grid-cols-5 gap-x-2 gap-y-1">
                                    {industrias.map((ind) => (
                                        <div key={ind.for_codigo} className="flex items-center gap-1.5 pl-1 min-w-0">
                                            <Checkbox
                                                id={`ind-${ind.for_codigo}`}
                                                checked={form.industrias.includes(ind.for_codigo)}
                                                onCheckedChange={() => toggleIndustria(ind.for_codigo)}
                                                className="shrink-0"
                                            />
                                            <label
                                                htmlFor={`ind-${ind.for_codigo}`}
                                                className="text-xs text-slate-600 cursor-pointer truncate select-none leading-none pt-0.5"
                                                title={ind.for_nomered || ind.for_nome}
                                            >
                                                {ind.for_nomered || ind.for_nome}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">Descrição</Label>
                            <Textarea
                                placeholder="Descreva a interação com o cliente..."
                                value={form.descricao}
                                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                                className="min-h-[100px] resize-none"
                            />
                        </div>
                    </div>
                )}

                <DialogFooter className="bg-slate-50 p-4 border-t gap-2">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={saving}
                    >
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        Salvar Interação
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default NovaInteracaoModal;
