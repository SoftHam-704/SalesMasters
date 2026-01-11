import { useState, useEffect } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Briefcase, Loader2, DollarSign, Phone } from 'lucide-react';
import { toast } from 'sonner';

// Custom Components
import InputField from '@/components/InputField';
import DbComboBox from '@/components/DbComboBox';
import { NODE_API_URL } from '../../utils/apiConfig';

export default function NovaOportunidadeModal({ open, onClose, onSuccess, opportunity = null }) {
    const [saving, setSaving] = useState(false);
    const isEditMode = !!opportunity;

    // Form Data
    const [titulo, setTitulo] = useState('');
    const [valor, setValor] = useState('');
    const [etapaId, setEtapaId] = useState(1);
    const [clientId, setClientId] = useState(null);
    const [clientLabel, setClientLabel] = useState('');

    // New Fields
    const [familiaId, setFamiliaId] = useState(null); // Industry/Supplier
    const [familiaLabel, setFamiliaLabel] = useState('');
    const [promotorId, setPromotorId] = useState(null); // Seller
    const [promotorLabel, setPromotorLabel] = useState('');
    const [telefoneContato, setTelefoneContato] = useState(''); // Phone for prospects

    // Reset or Populate Form
    useEffect(() => {
        if (open) {
            if (opportunity) {
                // Edit Mode
                setTitulo(opportunity.titulo);
                setValor(opportunity.valor_estimado ? opportunity.valor_estimado.toString() : '');
                setEtapaId(opportunity.etapa_id);

                setClientId(opportunity.cli_codigo);
                setClientLabel(opportunity.cli_nomred || '');

                setFamiliaId(opportunity.for_codigo);
                setFamiliaLabel(opportunity.industria_nome || '');

                setPromotorId(opportunity.ven_codigo);
                setPromotorLabel(opportunity.promotor_nome || '');
                setTelefoneContato(opportunity.telefone_contato || '');
            } else {
                // Create Mode
                setTitulo('');
                setValor('');
                setEtapaId(1);
                setClientId(null);
                setClientLabel('');
                setFamiliaId(null);
                setFamiliaLabel('');
                setPromotorId(null);
                setPromotorLabel('');
                setTelefoneContato('');
            }
        }
    }, [open, opportunity]);

    // Data Fetchers
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

    const fetchSuppliers = async (search) => {
        try {
            // Assuming endpoint supports search or generic list
            // For now using generic list filter
            const response = await fetch(`${NODE_API_URL}/api/suppliers`);
            const data = await response.json();
            if (!data.success) return [];

            const list = data.data || [];
            if (!search) return list.slice(0, 20);

            return list.filter(s =>
                s.nomeReduzido.toLowerCase().includes(search.toLowerCase()) ||
                s.razaoSocial.toLowerCase().includes(search.toLowerCase())
            ).slice(0, 20);
        } catch (error) {
            console.error(error);
            return [];
        }
    };

    const fetchSellers = async (search) => {
        try {
            const response = await fetch(`${NODE_API_URL}/api/sellers`); // Correct endpoint for vendedores
            const data = await response.json();
            if (!data.success) return [];

            const list = data.data || [];
            if (!search) return list;
            return list.filter(v =>
                v.ven_nome.toLowerCase().includes(search.toLowerCase())
            );
        } catch (error) {
            console.error(error);
            return [];
        }
    };

    // ... existing fetchObterEtapas ...
    const fetchObterEtapas = async () => {
        return [
            { id: 1, descricao: 'Prospecção' },
            { id: 2, descricao: 'Qualificação' },
            { id: 3, descricao: 'Proposta' },
            { id: 4, descricao: 'Negociação' },
            { id: 5, descricao: 'Fechamento' }
        ];
    };

    const handleSave = async () => {
        if (!titulo || !clientId || !valor) {
            toast.error('Preencha os campos obrigatórios');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                titulo,
                cli_codigo: clientId,
                ven_codigo: promotorId || 1, // Default to 1 if not selected, or logged user
                for_codigo: familiaId, // Industry
                valor_estimado: parseFloat(valor.replace(',', '.')),
                etapa_id: etapaId,
                telefone_contato: telefoneContato || null
            };

            let response;
            if (isEditMode) {
                response = await fetch(`${NODE_API_URL}/api/crm/oportunidades/${opportunity.oportunidade_id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                response = await fetch(`${NODE_API_URL}/api/crm/oportunidades`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            if (response.ok) {
                toast.success(isEditMode ? 'Oportunidade atualizada!' : 'Oportunidade criada!');
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
            <DialogContent className="max-w-md p-0 overflow-visible">
                <DialogHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 rounded-t-lg text-white">
                    <DialogTitle className="flex items-center gap-2">
                        <Briefcase className="w-5 h-5" />
                        {isEditMode ? 'Editar Oportunidade' : 'Nova Oportunidade'}
                    </DialogTitle>
                </DialogHeader>

                <div className="p-6 space-y-4">
                    {/* Client Combo - Clean & Standard */}
                    <div className="relative z-50">
                        <DbComboBox
                            label="Cliente *"
                            placeholder="Nome ou Fantasia..."
                            value={clientId ? { cli_codigo: clientId, cli_nomred: clientLabel } : null}
                            onChange={(val, item) => {
                                setClientId(val);
                                setClientLabel(item ? item.cli_nomred : '');
                            }}
                            fetchData={fetchClients}
                            labelKey="cli_nomred"
                            valueKey="cli_codigo"
                        />
                    </div>

                    {/* Promotor / Vendedor Combo */}
                    <div className="relative z-40">
                        <DbComboBox
                            label="Promotor / Responsável"
                            placeholder="Selecione o vendedor..."
                            value={promotorId ? { id: promotorId, nome: promotorLabel } : null}
                            onChange={(val, item) => {
                                setPromotorId(val);
                                setPromotorLabel(item ? item.nome : '');
                            }}
                            fetchData={fetchSellers}
                            labelKey="nome"
                            valueKey="id"
                        />
                    </div>

                    {/* Industry Combo */}
                    <div className="relative z-30">
                        <DbComboBox
                            label="Indústria / Representada"
                            placeholder="Selecione a indústria..."
                            value={familiaId ? { id: familiaId, nomeReduzido: familiaLabel } : null}
                            onChange={(val, item) => {
                                setFamiliaId(val);
                                setFamiliaLabel(item ? item.nomeReduzido : '');
                            }}
                            fetchData={fetchSuppliers}
                            labelKey="nomeReduzido"
                            valueKey="id"
                        />
                    </div>

                    {/* Title Input */}
                    <InputField
                        label="Título da Oportunidade *"
                        placeholder="Ex: Pedido Mensal"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                    />

                    {/* Value Input */}
                    <div className="relative">
                        <InputField
                            label="Valor Estimado (R$) *"
                            type="number"
                            placeholder="0.00"
                            value={valor}
                            onChange={(e) => setValor(e.target.value)}
                        />
                        <DollarSign className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 translate-y-1/2 pointer-events-none opacity-0" />
                    </div>

                    {/* Phone Input for Prospects */}
                    <div className="relative">
                        <Label className="text-xs font-semibold text-slate-600 mb-1 block">Telefone de Contato</Label>
                        <div className="relative">
                            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <Input
                                type="tel"
                                placeholder="(11) 99999-9999"
                                value={telefoneContato}
                                onChange={(e) => setTelefoneContato(e.target.value)}
                                className="pl-10 h-10"
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Use para prospects que ainda não são clientes cadastrados</p>
                    </div>

                    {/* Stage Combo */}
                    <div className="relative z-20">
                        <DbComboBox
                            label="Etapa Inicial"
                            value={etapaId ? { id: etapaId, descricao: '' } : null} // Label handles itself via internal logic usually, but passing object helps
                            initialLabel={['Prospecção', 'Qualificação', 'Proposta', 'Negociação', 'Fechamento'][etapaId - 1]}
                            onChange={(val) => setEtapaId(val)}
                            fetchData={fetchObterEtapas}
                            labelKey="descricao"
                            valueKey="id"
                            initialLimit={10}
                        />
                    </div>
                </div>

                <DialogFooter className="p-4 bg-slate-50 rounded-b-lg border-t gap-2">
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEditMode ? 'Salvar Alterações' : 'Salvar Oportunidade')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
