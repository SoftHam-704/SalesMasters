import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
    Save, Trash2, Calendar, ShoppingCart, Truck, CreditCard,
    FileText, User, MapPin, MoreHorizontal, FileUp, Copy,
    RefreshCw, Tag, DollarSign, Eraser, Star, StarOff, Percent, HelpCircle, CheckSquare,
    AlertTriangle, ArrowLeft, Loader2, Package, Search, Filter,
    Building2, HardHat, Ruler, Scale, LayoutDashboard, Wrench, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
// import { SmartOrderDialog } from './SmartOrderDialog'; // Removido por simplicidade inicial
// import OrderItemEntry from './OrderItemEntry'; // Removido - Grid simplificada aqui mesmo
import { NODE_API_URL, getApiUrl } from '../../utils/apiConfig';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import DbComboBox from '@/components/DbComboBox';
import InputField from '@/components/InputField';
import { auxDataService } from '@/services/orders/auxDataService';

// Modular imports
import { orderService } from '@/services/orders';
import { usePriceTable, useAuxData, useCliIndData, useCliAnivData, useSmartDiscounts } from '@/hooks/orders';
import { formatCurrency } from '@/utils/orders';

const maskCnpjCpf = (value) => {
    if (!value) return "";
    const cleanValue = value.replace(/\D/g, "");
    if (cleanValue.length === 11) {
        return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    } else if (cleanValue.length === 14) {
        return cleanValue.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    }
    return value;
};

const OrderFormProjetos = ({ selectedIndustry, onClose, onSave, existingOrder, readOnly }) => {
    // -------------------------------------------------------------------------
    // STATE & CONFIG
    // -------------------------------------------------------------------------
    const [displayNumber, setDisplayNumber] = useState('(Novo)');
    const [activeTab, setActiveTab] = useState('F1'); // F1=Geral, F2=Obra, F5=Itens

    // Initial State - Includes new Project Fields
    const initialFormState = {
        ped_pedido: '',
        ped_data: new Date().toISOString().split('T')[0],
        ped_situacao: 'P',
        ped_ramoatv: 'Projetos', // Default value

        // Relationship Keys
        ped_cliente: '',
        ped_transp: '',
        ped_vendedor: '',
        ped_tabela: '',
        ped_condpag: '',

        // Project Specifics (New Columns)
        ped_obra_nome: '',
        ped_obra_endereco: '',
        ped_obra_contato: '',
        ped_fase_projeto: 'Orçamento', // Orçamento, Anteprojeto, Executivo
        ped_area_m2: '',
        ped_pe_direito: '',
        ped_tipo_piso: '',
        ped_obs_tecnicas: '',

        // Commercial
        ped_pri: 0, ped_seg: 0,
        ped_totbruto: 0,
        ped_totliq: 0,
        ped_totalipi: 0,
        ped_obs: '',
    };

    const [formData, setFormData] = useState(initialFormState);
    const [summaryItems, setSummaryItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isPersisted, setIsPersisted] = useState(!!existingOrder);

    // Names for display in Combos
    const [selectedClientName, setSelectedClientName] = useState('');
    const [selectedTranspName, setSelectedTranspName] = useState('');
    const [selectedSellerName, setSelectedSellerName] = useState('');

    // Hooks
    const auxData = useAuxData(formData.ped_industria || selectedIndustry?.for_codigo);
    const priceTable = usePriceTable(
        formData.ped_industria || selectedIndustry?.for_codigo,
        formData.ped_tabela
    );

    // -------------------------------------------------------------------------
    // DATA FETCHERS (Simplified)
    // -------------------------------------------------------------------------
    const fetchClients = async (search) => {
        const res = await auxDataService.getClients('A', search);
        return (res.data || []).map(c => ({
            label: `${c.cli_nomred || c.cli_nome} - ${maskCnpjCpf(c.cli_cnpj)}`,
            value: c.cli_codigo,
            nomred: c.cli_nomred,
            ...c
        }));
    };

    const fetchCarriers = async (search) => {
        const res = await auxDataService.getCarriers(search);
        return (res.data || []).map(t => ({
            label: t.nome || t.tra_nome,
            value: t.codigo || t.tra_codigo,
            ...t
        }));
    };

    const fetchSellers = async (search) => {
        const res = await auxDataService.getSellers(search);
        return (res.data || []).map(s => ({
            label: s.nome || s.ven_nome,
            value: s.codigo || s.ven_codigo,
            ...s
        }));
    };

    const fetchPriceTables = async (search) => {
        const res = await auxDataService.getPriceTables(selectedIndustry?.for_codigo, search);
        return (res.data || []).map(t => ({
            label: t.nome_tabela || t.tab_descricao || t.itab_nome,
            value: t.nome_tabela || t.itab_idtabela || t.tab_codigo || t.codigo,
            ...t
        }));
    };

    // -------------------------------------------------------------------------
    // INITIALIZATION
    // -------------------------------------------------------------------------
    useEffect(() => {
        const initializeForm = async () => {
            if (existingOrder) {
                // Map existing order + project fields (if they exist in DB response)
                setFormData(prev => ({
                    ...prev,
                    ...existingOrder,
                    ped_data: existingOrder.ped_data ? new Date(existingOrder.ped_data).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    // Ensure project fields map correctly if backend sends them
                    ped_obra_nome: existingOrder.ped_obra_nome || '',
                    ped_fase_projeto: existingOrder.ped_fase_projeto || 'Orçamento',
                }));
                setDisplayNumber(existingOrder.ped_pedido);
                setIsPersisted(true);

                // Set initial names
                if (existingOrder.cli_nomred) setSelectedClientName(existingOrder.cli_nomred);
                if (existingOrder.tra_nome) setSelectedTranspName(existingOrder.tra_nome);
                if (existingOrder.ven_nome) setSelectedSellerName(existingOrder.ven_nome);

                if (existingOrder.ped_pedido) loadSummaryItems(existingOrder.ped_pedido);
            } else {
                setFormData(prev => ({
                    ...initialFormState,
                    ped_industria: selectedIndustry?.for_codigo || '',
                }));
                loadNextNumber();
            }
        };
        initializeForm();
    }, [existingOrder, selectedIndustry]);

    const loadNextNumber = async () => {
        try {
            let initials = 'PRJ'; // Default Project Prefix
            const userStr = sessionStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                const first = user.nome ? user.nome.charAt(0) : '';
                const last = user.sobrenome ? user.sobrenome.charAt(0) : '';
                initials = (first + last).toUpperCase() || 'SM';
            }
            const data = await orderService.getNextNumber(initials);
            if (data.success) {
                setDisplayNumber(data.data.formatted_number);
                setFormData(prev => ({ ...prev, ped_pedido: data.data.formatted_number, ped_numero: data.data.sequence }));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const loadSummaryItems = async (orderId) => {
        if (!orderId) return;
        try {
            const data = await orderService.getItems(orderId);
            if (data.success) setSummaryItems(data.data);
        } catch (e) { console.error(e); }
    };

    // -------------------------------------------------------------------------
    // HANDLERS
    // -------------------------------------------------------------------------
    const handleFieldChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAddItem = () => {
        // Simple Add Item Logic for Project Grid
        // Ideally opens a Dialog to select product from table
        toast.info("Funcionalidade de adicionar itens em desenvolvimento para módulo Projetos.");
    };

    const handleSave = async () => {
        if (!formData.ped_cliente) { toast.error("Selecione um cliente."); return; }

        setIsSaving(true);
        try {
            // Prepare payload
            const dataToSave = {
                ...formData,
                ped_industria: formData.ped_industria || selectedIndustry?.for_codigo,
                _isPersisted: isPersisted
            };

            const result = await orderService.save(dataToSave);
            if (result.success) {
                setIsPersisted(true);
                toast.success("Projeto salvo com sucesso!");
                if (onSave) onSave(result.data);
            }
        } catch (error) {
            toast.error("Erro ao salvar projeto: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    // -------------------------------------------------------------------------
    // RENDER
    // -------------------------------------------------------------------------
    return (
        <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col animate-in fade-in duration-200">
            {/* --- HEADER --- */}
            <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm shrink-0">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-100 p-2 rounded-lg text-indigo-700">
                        <HardHat className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                            Gestão de Projetos
                            <span className="text-sm font-normal text-slate-400">|</span>
                            <span className="text-sm font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                {displayNumber}
                            </span>
                        </h1>
                        <p className="text-xs text-slate-500 font-medium">{selectedIndustry?.nome_fantasia || 'Nova Venda Consultiva'}</p>
                    </div>
                    {isPersisted && (
                        <div className="ml-6 bg-amber-50 border border-amber-100 text-amber-700 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest hidden md:block">
                            Bertolini Enterprise Exclusive
                        </div>
                    )}
                </div>

                {/* TABS HEADER */}
                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                    {[
                        { id: 'F1', label: 'Dados Gerais', icon: FileText },
                        { id: 'F2', label: 'Engenharia & Obra', icon: Building2 },
                        { id: 'F3', label: 'Checklist Técnico', icon: CheckSquare },
                        { id: 'F5', label: 'Itens & Materiais', icon: Package },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all",
                                activeTab === tab.id
                                    ? "bg-white text-indigo-600 shadow-sm ring-1 ring-black/5"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                            )}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ACTION BUTTONS (TOP RIGHT) */}
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-red-50 hover:text-red-500">
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* --- MAIN CONTENT AREA --- */}
            <div className="flex-1 overflow-hidden relative">

                {/* --- TAB F1: DADOS GERAIS --- */}
                <div className={cn("absolute inset-0 p-6 overflow-y-auto", activeTab !== 'F1' && "hidden")}>
                    <div className="max-w-5xl mx-auto space-y-6">

                        {/* CLIENTE DO PROJETO */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wide">
                                <User className="h-4 w-4 text-indigo-500" /> Cliente / Parceiro
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-slate-500">Cliente (F8)</Label>
                                    <DbComboBox
                                        fetchItems={fetchClients}
                                        value={formData.ped_cliente}
                                        initialLabel={selectedClientName}
                                        onChange={(val, item) => {
                                            handleFieldChange('ped_cliente', val);
                                            setSelectedClientName(item.label);
                                            // Auto-fill transportadora/vendedor se vier do cadastro
                                            if (item.cli_vendedor) handleFieldChange('ped_vendedor', item.cli_vendedor);
                                        }}
                                        placeholder="Busque por Nome ou CNPJ..."
                                        className="h-10 text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-slate-500">Tabela de Preço</Label>
                                    <DbComboBox
                                        fetchItems={fetchPriceTables}
                                        value={formData.ped_tabela}
                                        onChange={(val) => handleFieldChange('ped_tabela', val)}
                                        placeholder="Selecione a tabela..."
                                        className="h-10 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* COMERCIAL */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wide">
                                <DollarSign className="h-4 w-4 text-emerald-500" /> Condições Comerciais
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <InputField
                                    label="Vendedor Responsável"
                                    value={formData.ped_vendedor} // Idealmente usar DbComboBox aqui também
                                    onChange={(e) => handleFieldChange('ped_vendedor', e.target.value)}
                                    placeholder="Cód. Vendedor"
                                />
                                <InputField
                                    label="Condição Pagamento"
                                    value={formData.ped_condpag}
                                    onChange={(e) => handleFieldChange('ped_condpag', e.target.value)}
                                    placeholder="Ex: 30/60/90DD"
                                />
                                <InputField
                                    label="Transportadora"
                                    value={formData.ped_transp}
                                    onChange={(e) => handleFieldChange('ped_transp', e.target.value)}
                                    placeholder="Cód. Transportadora"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- TAB F2: DADOS DA OBRA (NOVO) --- */}
                <div className={cn("absolute inset-0 p-6 overflow-y-auto", activeTab !== 'F2' && "hidden")}>
                    <div className="max-w-5xl mx-auto space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-sm ring-4 ring-indigo-50/50">
                            <div className="flex items-center justify-between mb-6 border-b border-indigo-100 pb-4">
                                <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                                    <HardHat className="h-6 w-6 text-indigo-600" />
                                    Ficha Técnica do Projeto
                                </h3>
                                <div className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
                                    Engenharia & Montagem
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="space-y-2">
                                    <Label className="text-indigo-900 font-semibold">Nome da Obra / Projeto</Label>
                                    <Input
                                        value={formData.ped_obra_nome}
                                        onChange={(e) => handleFieldChange('ped_obra_nome', e.target.value)}
                                        placeholder="Ex: Ampliação CD Cajamar - Galpão 3"
                                        className="h-11 border-indigo-200 focus:ring-indigo-500 text-lg font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-indigo-900 font-semibold">Fase do Projeto</Label>
                                    <Select
                                        value={formData.ped_fase_projeto}
                                        onValueChange={(val) => handleFieldChange('ped_fase_projeto', val)}
                                    >
                                        <SelectTrigger className="h-11 border-indigo-200">
                                            <SelectValue placeholder="Selecione a fase" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Orçamento">Orçamento Inicial</SelectItem>
                                            <SelectItem value="Anteprojeto">Anteprojeto / Estudo</SelectItem>
                                            <SelectItem value="Executivo">Projeto Executivo</SelectItem>
                                            <SelectItem value="AsBuilt">As Built (Finalizado)</SelectItem>
                                            <SelectItem value="Manutencao">Manutenção / Reparo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-slate-600"><Ruler className="h-4 w-4" /> Área Total (m²)</Label>
                                    <Input
                                        type="number"
                                        value={formData.ped_area_m2}
                                        onChange={(e) => handleFieldChange('ped_area_m2', e.target.value)}
                                        placeholder="0.00"
                                        className="bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-slate-600"><ArrowLeft className="h-4 w-4 rotate-90" /> Pé Direito Livre (m)</Label>
                                    <Input
                                        type="number"
                                        value={formData.ped_pe_direito}
                                        onChange={(e) => handleFieldChange('ped_pe_direito', e.target.value)}
                                        placeholder="0.00"
                                        className="bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-slate-600"><Scale className="h-4 w-4" /> Capacidade Piso (kg/m²)</Label>
                                    <Input
                                        value={formData.ped_tipo_piso} // Usando campo texto para flexibilidade
                                        onChange={(e) => handleFieldChange('ped_tipo_piso', e.target.value)}
                                        placeholder="Ex: 5000 kg/m²"
                                        className="bg-white"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 space-y-2">
                                <Label className="text-slate-700 font-semibold">Endereço da Instalação</Label>
                                <Input
                                    value={formData.ped_obra_endereco}
                                    onChange={(e) => handleFieldChange('ped_obra_endereco', e.target.value)}
                                    placeholder="Rua, Número, Bairro, Cidade - UF"
                                    className="border-slate-200"
                                />
                            </div>

                            <div className="mt-6 space-y-2">
                                <Label className="text-slate-700 font-semibold">Observações Técnicas / Restrições</Label>
                                <textarea
                                    value={formData.ped_obs_tecnicas || ''}
                                    onChange={(e) => handleFieldChange('ped_obs_tecnicas', e.target.value)}
                                    className="w-full h-32 rounded-md border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                    placeholder="Descreva detalhes como: Horário de acesso restrito, necessidade de EPI especial, interferências, etc."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- TAB F3: CHECKLIST TÉCNICO --- */}
                <div className={cn("absolute inset-0 p-6 overflow-y-auto", activeTab !== 'F3' && "hidden")}>
                    <div className="max-w-4xl mx-auto space-y-6">
                        <div className="bg-white p-8 rounded-2xl border border-blue-100 shadow-xl ring-1 ring-blue-50">
                            <h3 className="text-xl font-extrabold text-blue-900 mb-8 flex items-center gap-3">
                                <CheckSquare className="h-6 w-6 text-blue-600" />
                                Requisitos de Engenharia (Checklist)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    "ART de Projeto disponível?",
                                    "Piso nivelado (tolerância L/300)?",
                                    "Ponto de energia 220v no local?",
                                    "Acesso livre para caminhão truck?",
                                    "Espaço para guarda de materiais?",
                                    "Iluminação adequada no galpão?"
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                                        <div className="w-5 h-5 rounded border-2 border-slate-300" />
                                        <span className="text-sm font-bold text-slate-700">{item}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-8 p-5 bg-indigo-600 rounded-xl text-white">
                                <p className="text-xs font-bold uppercase tracking-wider mb-1">Estratégia Bertolini vs Salesforce</p>
                                <p className="text-[11px] opacity-90">Diferente de sistemas genéricos, os dados técnicos aqui integrados alimentam o cronograma real da obra.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- TAB F5: ITENS (SIMPLIFICADA) --- */}
                <div className={cn("absolute inset-0 flex flex-col p-4", activeTab !== 'F5' && "hidden")}>
                    <div className="flex-1 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
                        <div className="p-2 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lista de Materiais</span>
                            <Button size="sm" onClick={handleAddItem} className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700">
                                <Package className="h-3 w-3 mr-1" /> Adicionar Produto
                            </Button>
                        </div>

                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 w-[60px]">Seq</th>
                                        <th className="px-4 py-3">Código</th>
                                        <th className="px-4 py-3">Descrição Produto</th>
                                        <th className="px-4 py-3 text-center w-[100px]">Unid.</th>
                                        <th className="px-4 py-3 text-right w-[100px]">Quant.</th>
                                        <th className="px-4 py-3 text-right w-[120px]">Preço Unit.</th>
                                        <th className="px-4 py-3 text-right w-[120px]">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {summaryItems.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="p-10 text-center text-slate-400 italic">
                                                Nenhum item adicionado ao projeto.
                                            </td>
                                        </tr>
                                    ) : (
                                        summaryItems.map((item, idx) => (
                                            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                                                <td className="px-4 py-2 text-slate-400">{item.ite_seq || idx + 1}</td>
                                                <td className="px-4 py-2 font-medium text-slate-700">{item.ite_produto}</td>
                                                <td className="px-4 py-2 text-slate-600">{item.ite_nomeprod || 'Produto sem descrição'}</td>
                                                <td className="px-4 py-2 text-center text-slate-500 text-xs">UN</td>
                                                <td className="px-4 py-2 text-right font-bold text-slate-800">{item.ite_quant}</td>
                                                <td className="px-4 py-2 text-right text-slate-600">R$ {(item.ite_puniliq || 0).toFixed(2)}</td>
                                                <td className="px-4 py-2 text-right font-bold text-indigo-600">R$ {(item.ite_totliquido || 0).toFixed(2)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>

            {/* --- FOOTER --- */}
            <div className="bg-white border-t border-slate-200 px-6 py-4 flex justify-between items-center shrink-0 z-50">
                <div className="flex items-center gap-6">
                    <div>
                        <span className="block text-[10px] text-slate-400 font-bold uppercase">Total Itens</span>
                        <span className="text-xl font-bold text-slate-700">{summaryItems.length}</span>
                    </div>
                    <div>
                        <span className="block text-[10px] text-slate-400 font-bold uppercase">Valor Total</span>
                        <span className="text-xl font-bold text-emerald-600">
                            {formatCurrency(summaryItems.reduce((acc, i) => acc + (parseFloat(i.ite_totliquido) || 0), 0))}
                        </span>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" onClick={onClose} size="lg" className="h-11">Cancelar</Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        size="lg"
                        className="h-11 bg-indigo-600 hover:bg-indigo-700 text-white min-w-[150px]"
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Salvar Projeto
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default OrderFormProjetos;
