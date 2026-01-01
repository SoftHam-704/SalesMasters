import { useState, useEffect } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, DollarSign, User, Search, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function NovaOportunidadeModal({ open, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form
    const [titulo, setTitulo] = useState('');
    const [valor, setValor] = useState('');
    const [etapa, setEtapa] = useState('1');
    const [selectedClient, setSelectedClient] = useState(null);

    // Client Search
    const [clientSearch, setClientSearch] = useState('');
    const [clients, setClients] = useState([]);
    const [searchingClients, setSearchingClients] = useState(false);

    // Reset when opening
    useEffect(() => {
        if (open) {
            setTitulo('');
            setValor('');
            setEtapa('1');
            setSelectedClient(null);
            setClientSearch('');
            setClients([]);
        }
    }, [open]);

    const searchClients = async () => {
        if (clientSearch.length < 2) return;
        setSearchingClients(true);
        try {
            const response = await fetch(`http://localhost:3005/api/clients?search=${encodeURIComponent(clientSearch)}&limit=5`);
            const data = await response.json();
            if (data.success) setClients(data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setSearchingClients(false);
        }
    };

    const handleSave = async () => {
        if (!titulo || !selectedClient || !valor) {
            toast.error('Preencha os campos obrigatórios');
            return;
        }

        setSaving(true);
        try {
            const response = await fetch('http://localhost:3005/api/crm/oportunidades', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    titulo,
                    cli_codigo: selectedClient.cli_codigo,
                    ven_codigo: 1, // TODO: Auth
                    valor_estimado: parseFloat(valor.replace(',', '.')),
                    etapa_id: parseInt(etapa)
                })
            });

            if (response.ok) {
                toast.success('Oportunidade criada!');
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
            <DialogContent className="max-w-md">
                <DialogHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 -mx-6 -mt-6 rounded-t-lg text-white">
                    <DialogTitle className="flex items-center gap-2">
                        <Briefcase className="w-5 h-5" />
                        Nova Oportunidade
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Client Search */}
                    <div className="space-y-2">
                        <Label>Cliente *</Label>
                        <div className="relative">
                            <Input
                                placeholder="Buscar cliente..."
                                value={clientSearch}
                                onChange={e => setClientSearch(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && searchClients()}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1/2 -translate-y-1/2"
                                onClick={searchClients}
                            >
                                <Search className="w-4 h-4" />
                            </Button>
                        </div>
                        {/* Results */}
                        {clients.length > 0 && (
                            <div className="border rounded-md shadow-sm max-h-32 overflow-y-auto">
                                {clients.map(cli => (
                                    <div
                                        key={cli.cli_codigo}
                                        className="p-2 hover:bg-slate-100 cursor-pointer text-sm"
                                        onClick={() => {
                                            setSelectedClient(cli);
                                            setClientSearch(cli.cli_nomred);
                                            setClients([]);
                                        }}
                                    >
                                        {cli.cli_nomred}
                                    </div>
                                ))}
                            </div>
                        )}
                        {selectedClient && (
                            <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                                <Check className="w-3 h-3" /> Selecionado: {selectedClient.cli_nomred}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Título da Oportunidade *</Label>
                        <Input
                            placeholder="Ex: Pedido mensal, Projeto Loja Nova..."
                            value={titulo}
                            onChange={e => setTitulo(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Valor Estimado (R$) *</Label>
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={valor}
                            onChange={e => setValor(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Etapa Inicial</Label>
                        <Select value={etapa} onValueChange={setEtapa}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">Prospecção</SelectItem>
                                <SelectItem value="2">Qualificação</SelectItem>
                                <SelectItem value="3">Proposta</SelectItem>
                                <SelectItem value="4">Negociação</SelectItem>
                                <SelectItem value="5">Fechamento</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Oportunidade'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
