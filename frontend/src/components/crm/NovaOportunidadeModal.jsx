import { useState, useEffect } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Target, Shield } from 'lucide-react';
import { toast } from 'sonner';

// Custom Components
import DbComboBox from '@/components/DbComboBox';
import { NODE_API_URL } from '../../utils/apiConfig';
import { cn } from "@/lib/utils";

export default function NovaOportunidadeModal({ open, onClose, onSuccess, opportunity = null }) {
    const [saving, setSaving] = useState(false);
    const isEditMode = !!opportunity;

    // Form Data
    const [titulo, setTitulo] = useState('');
    const [valor, setValor] = useState('');
    const [etapaId, setEtapaId] = useState(1);
    const [clientId, setClientId] = useState(null);
    const [clientLabel, setClientLabel] = useState('');
    const [familiaId, setFamiliaId] = useState(null);
    const [familiaLabel, setFamiliaLabel] = useState('');
    const [promotorId, setPromotorId] = useState(null);
    const [promotorLabel, setPromotorLabel] = useState('');
    const [telefoneContato, setTelefoneContato] = useState('');

    useEffect(() => {
        if (open) {
            if (opportunity) {
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
                setTitulo(''); setValor(''); setEtapaId(1); setClientId(null); setClientLabel('');
                setFamiliaId(null); setFamiliaLabel(''); setPromotorId(null); setPromotorLabel('');
                setTelefoneContato('');
            }
        }
    }, [open, opportunity]);

    const fetchClients = async (search) => {
        try {
            const response = await fetch(`${NODE_API_URL}/api/clients?search=${encodeURIComponent(search || '')}&limit=10`);
            const data = await response.json();
            return data.success ? data.data : [];
        } catch (error) { return []; }
    };

    const fetchSuppliers = async (search) => {
        try {
            const response = await fetch(`${NODE_API_URL}/api/suppliers`);
            const data = await response.json();
            const list = data.success ? data.data : (Array.isArray(data) ? data : []);
            if (!search) return list.slice(0, 20);
            return list.filter(s => (s.nomeReduzido || s.razaoSocial || '').toLowerCase().includes(search.toLowerCase())).slice(0, 20);
        } catch (error) { return []; }
    };

    const fetchSellers = async (search) => {
        try {
            const response = await fetch(`${NODE_API_URL}/api/sellers`);
            const data = await response.json();
            const list = data.success ? data.data : (Array.isArray(data) ? data : []);
            if (!search) return list;
            return list.filter(v => (v.ven_nome || '').toLowerCase().includes(search.toLowerCase()));
        } catch (error) { return []; }
    };

    const fetchObterEtapas = async () => ([
        { id: 1, descricao: 'Prospecção' },
        { id: 2, descricao: 'Qualificação' },
        { id: 3, descricao: 'Proposta' },
        { id: 4, descricao: 'Negociação' },
        { id: 5, descricao: 'Fechamento' }
    ]);

    const handleSave = async () => {
        if (!titulo || !clientId || !valor) return toast.error('Parâmetros obrigatórios ausentes');
        setSaving(true);
        try {
            const payload = {
                titulo,
                cli_codigo: clientId,
                ven_codigo: promotorId || JSON.parse(sessionStorage.getItem('user'))?.id || 1,
                for_codigo: familiaId,
                valor_estimado: parseFloat(valor.replace(',', '.')),
                etapa_id: etapaId,
                telefone_contato: telefoneContato || null
            };
            const method = isEditMode ? 'PUT' : 'POST';
            const url = isEditMode ? `${NODE_API_URL}/api/crm/oportunidades/${opportunity.oportunidade_id}` : `${NODE_API_URL}/api/crm/oportunidades`;
            const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (response.ok) { toast.success('Missão Parametrizada'); onSuccess?.(); onClose(); }
            else { toast.error('Falha de Sincronização'); }
        } catch (error) { toast.error('Erro de Protocolo'); }
        finally { setSaving(false); }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md p-0 gap-0 overflow-hidden bg-white border-slate-200 shadow-2xl rounded-2xl">
                <DialogHeader className="sr-only">
                    <DialogTitle>{isEditMode ? 'Ajustar Oportunidade' : 'Configurar Alvo'}</DialogTitle>
                    <DialogDescription>Definição tática de oportunidade de mercado.</DialogDescription>
                </DialogHeader>

                {/* Premium Header */}
                <div className="bg-slate-900 p-6 flex justify-between items-center shadow-md z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                            <Target size={20} />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-0.5">Pipeline Estratégico</span>
                            <h2 className="text-lg font-black uppercase tracking-tight text-white">{isEditMode ? 'Ajustar Alvo' : 'Nova Missão'}</h2>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar bg-slate-50/30">
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <Label className="tactical-label">Identificação do Alvo (Cliente) *</Label>
                            <DbComboBox
                                placeholder="Ponto de Contato..."
                                value={clientId ? { cli_codigo: clientId, cli_nomred: clientLabel } : null}
                                onChange={(val, item) => { setClientId(val); setClientLabel(item ? item.cli_nomred : ''); }}
                                fetchData={fetchClients}
                                labelKey="cli_nomred"
                                valueKey="cli_codigo"
                                className="bg-white border-slate-200 h-11 text-slate-900 shadow-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="tactical-label">Título da Operação *</Label>
                            <Input
                                placeholder="Codinome da Oportunidade..."
                                value={titulo}
                                onChange={(e) => setTitulo(e.target.value)}
                                className="h-11 bg-white border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 rounded-xl shadow-sm placeholder:text-slate-400"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="tactical-label">Impacto (BRL) *</Label>
                                <Input
                                    placeholder="0.00"
                                    value={valor}
                                    onChange={(e) => setValor(e.target.value)}
                                    className="h-11 bg-white border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 rounded-xl font-bold text-blue-600 shadow-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="tactical-label">Contato Direto</Label>
                                <Input
                                    type="tel"
                                    placeholder="(00) 00000-0000"
                                    value={telefoneContato}
                                    onChange={(e) => setTelefoneContato(e.target.value)}
                                    className="h-11 bg-white border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 rounded-xl shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="tactical-label">Responsável / Unidade</Label>
                            <DbComboBox
                                placeholder="Selecionar Operador..."
                                value={promotorId ? { id: promotorId, ven_nome: promotorLabel } : null}
                                onChange={(val, item) => { setPromotorId(val); setPromotorLabel(item ? item.ven_nome : ''); }}
                                fetchData={fetchSellers}
                                labelKey="ven_nome"
                                valueKey="ven_codigo"
                                className="bg-white border-slate-200 h-11 text-slate-900 shadow-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="tactical-label">Indústria de Apoio</Label>
                            <DbComboBox
                                placeholder="Vincular Indústria..."
                                value={familiaId ? { id: familiaId, nomeReduzido: familiaLabel } : null}
                                onChange={(val, item) => { setFamiliaId(val); setFamiliaLabel(item ? item.nomeReduzido : ''); }}
                                fetchData={fetchSuppliers}
                                labelKey="nomeReduzido"
                                valueKey="for_codigo"
                                className="bg-white border-slate-200 h-11 text-slate-900 shadow-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="tactical-label">Status do Funil</Label>
                            <DbComboBox
                                placeholder="Estágio Estratégico..."
                                value={etapaId ? { id: etapaId, descricao: '' } : null}
                                initialLabel={['Prospecção', 'Qualificação', 'Proposta', 'Negociação', 'Fechamento'][etapaId - 1]}
                                onChange={(val) => setEtapaId(val)}
                                fetchData={fetchObterEtapas}
                                labelKey="descricao"
                                valueKey="id"
                                className="bg-white border-slate-200 h-11 text-slate-900 shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-4 px-8">
                    <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-slate-600 uppercase text-[10px] font-bold px-6">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest px-10 h-12 rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
                    >
                        {saving ? <Loader2 className="animate-spin" /> : 'Sincronizar Alvo'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
