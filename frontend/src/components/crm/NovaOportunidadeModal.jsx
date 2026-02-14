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
            const response = await fetch(`${NODE_API_URL}/api/suppliers?status=A`);
            const data = await response.json();
            const list = data.success ? data.data : (Array.isArray(data) ? data : []);
            if (!search) return list.slice(0, 20);
            return list.filter(s => (s.for_nomered || s.for_nome || '').toLowerCase().includes(search.toLowerCase())).slice(0, 20);
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

                {/* High-Contrast Professional Header */}
                <div className="bg-[#003366] p-6 flex justify-between items-center border-b border-blue-800">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white border border-white/20">
                            <Target size={26} />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest block mb-0.5">MÓDULO DE ESTRATÉGIA</span>
                            <h2 className="text-xl font-bold text-white uppercase tracking-tight">Nova Missão / Alvo</h2>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar bg-white">
                    <div className="space-y-6">
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-5">
                            <div className="space-y-2">
                                <Label className="text-sm font-black text-slate-900 uppercase">Identificação do Alvo (Cliente) *</Label>
                                <DbComboBox
                                    placeholder="Pesquisar ponto de contato..."
                                    value={clientId ? { cli_codigo: clientId, cli_nomred: clientLabel } : null}
                                    onChange={(val, item) => { setClientId(val); setClientLabel(item ? item.cli_nomred : ''); }}
                                    fetchData={fetchClients}
                                    labelKey="cli_nomred"
                                    valueKey="cli_codigo"
                                    className="bg-white border-slate-400 h-12 text-slate-900 font-bold shadow-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-black text-slate-900 uppercase">Título da Operação *</Label>
                                <Input
                                    placeholder="Ex: Expansão Mix de Produtos..."
                                    value={titulo}
                                    onChange={(e) => setTitulo(e.target.value)}
                                    className="h-12 border-slate-400 text-slate-900 font-bold focus:border-blue-600 rounded-lg"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-black text-slate-900 uppercase">Impacto Estimado (BRL) *</Label>
                                    <Input
                                        placeholder="0.00"
                                        value={valor}
                                        onChange={(e) => setValor(e.target.value)}
                                        className="h-12 border-slate-400 text-blue-700 font-black text-lg focus:border-blue-600 rounded-lg"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-black text-slate-900 uppercase">Contato Direto</Label>
                                    <Input
                                        type="tel"
                                        placeholder="(00) 00000-0000"
                                        value={telefoneContato}
                                        onChange={(e) => setTelefoneContato(e.target.value)}
                                        className="h-12 border-slate-400 text-slate-900 font-bold rounded-lg"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-5">
                            <div className="space-y-2">
                                <Label className="text-sm font-black text-slate-900 uppercase">Responsável / Unidade</Label>
                                <DbComboBox
                                    placeholder="Selecionar Operador..."
                                    value={promotorId ? { id: promotorId, ven_nome: promotorLabel } : null}
                                    onChange={(val, item) => { setPromotorId(val); setPromotorLabel(item ? item.ven_nome : ''); }}
                                    fetchData={fetchSellers}
                                    labelKey="ven_nome"
                                    valueKey="ven_codigo"
                                    className="bg-white border-slate-400 h-12 text-slate-900 font-bold shadow-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-black text-slate-900 uppercase">Indústria de Apoio</Label>
                                    <DbComboBox
                                        placeholder="Vincular Indústria..."
                                        value={familiaId ? { id: familiaId, for_nomered: familiaLabel } : null}
                                        onChange={(val, item) => { setFamiliaId(val); setFamiliaLabel(item ? item.for_nomered : ''); }}
                                        fetchData={fetchSuppliers}
                                        labelKey="for_nomered"
                                        valueKey="for_codigo"
                                        className="bg-white border-slate-400 h-12 text-slate-900 font-bold shadow-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-black text-slate-900 uppercase">Estágio do Funil</Label>
                                    <DbComboBox
                                        placeholder="Situação..."
                                        value={etapaId ? { id: etapaId, descricao: '' } : null}
                                        initialLabel={['Prospecção', 'Qualificação', 'Proposta', 'Negociação', 'Fechamento'][etapaId - 1]}
                                        onChange={(val) => setEtapaId(val)}
                                        fetchData={fetchObterEtapas}
                                        labelKey="descricao"
                                        valueKey="id"
                                        className="bg-white border-slate-400 h-12 text-slate-900 font-bold shadow-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

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
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-800 text-white font-black uppercase text-[10px] px-6 h-14 shadow-xl flex-1 md:flex-none"
                    >
                        {saving ? <Loader2 className="animate-spin" /> : 'CONFIRMAR E SINCRONIZAR MISSÃO'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
