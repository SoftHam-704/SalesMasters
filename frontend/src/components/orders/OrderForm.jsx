import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
    Save, X, Loader2, Search, Plus, Trash2, RefreshCw, Package, Check,
    ChevronsUpDown, Edit2, LayoutDashboard, ShoppingCart, CreditCard,
    ClipboardCheck, FileCheck, FileUp, FileJson, FileCode, ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import OrderItemEntry from './OrderItemEntry';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";

// Modular imports
import { orderService } from '@/services/orders';
import { usePriceTable, useAuxData } from '@/hooks/orders';
import { formatCurrency } from '@/utils/orders';



const DiscountInput = ({ value, onChange, label }) => {
    const [isFocused, setIsFocused] = useState(false);
    const [localValue, setLocalValue] = useState("");

    useEffect(() => {
        if (!isFocused) {
            if (!value || value === 0) {
                setLocalValue("");
            } else {
                setLocalValue(parseFloat(value).toFixed(2).replace('.', ',') + "%");
            }
        }
    }, [value, isFocused]);

    return (
        <div className="flex flex-col items-center">
            <span className="text-[9px] text-gray-400 font-bold mb-0.5">{label}</span>
            <Input
                type="text"
                placeholder="0,00%"
                value={isFocused ? localValue : (!value || value === 0 ? "" : parseFloat(value).toFixed(2).replace('.', ',') + '%')}
                onFocus={(e) => {
                    setIsFocused(true);
                    let val = String(value || "").replace('%', '').replace('.', ',');
                    if (val === "0") val = "";
                    setLocalValue(val);
                    e.target.select();
                }}
                onChange={(e) => {
                    setLocalValue(e.target.value);
                }}
                onBlur={() => {
                    setIsFocused(false);
                    let val = localValue.replace('%', '').replace(',', '.');
                    const num = parseFloat(val) || 0;
                    onChange(num);
                }}
                className="h-6 text-center text-[10px] font-bold p-0 border-emerald-100 placeholder:text-gray-300 text-black"
            />
        </div>
    )
}

const OrderForm = ({ selectedIndustry, onClose, onSave, existingOrder }) => {
    // Display state
    const [displayNumber, setDisplayNumber] = useState('(Novo)');
    const [activeTab, setActiveTab] = useState('F1'); // Default to F1 (Capa) to show the form fields

    // Search state for comboboxes
    const [clienteSearch, setClienteSearch] = useState("");
    const [transpSearch, setTranspSearch] = useState("");
    const [vendedorSearch, setVendedorSearch] = useState("");
    const [tabelaSearch, setTabelaSearch] = useState("");

    // Popover states
    const [openCliente, setOpenCliente] = useState(false);
    const [openTransp, setOpenTransp] = useState(false);
    const [openVendedor, setOpenVendedor] = useState(false);
    const [openTabela, setOpenTabela] = useState(false);
    const [openSituacao, setOpenSituacao] = useState(false);
    const [openFrete, setOpenFrete] = useState(false);

    // Initial Form State
    const initialFormState = {
        ped_pedido: '',
        ped_data: new Date().toISOString().split('T')[0],
        ped_situacao: 'P',
        ped_cliente: '',
        ped_transp: '',
        ped_vendedor: '',
        ped_conpgto: '',
        ped_comprador: '',
        ped_frete: 'C',
        ped_pedcli: '',
        ped_pedindu: '',
        ped_tabela: '',
        ped_pri: 0, ped_seg: 0, ped_ter: 0,
        ped_qua: 0, ped_qui: 0, ped_sex: 0,
        ped_set: 0, ped_oit: 0, ped_nov: 0,
        ped_totbruto: 0,
        ped_totliq: 0,
        ped_totalipi: 0,
        ped_permiterepe: false,
        ped_obs: '',
    };

    // Form state
    const [formData, setFormData] = useState(initialFormState);

    // UI state
    const [allowDuplicates, setAllowDuplicates] = useState(false);
    const [loading, setLoading] = useState(false);
    const [summaryItems, setSummaryItems] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    // Use custom hooks for data management
    const auxData = useAuxData(selectedIndustry?.for_codigo);
    const priceTable = usePriceTable(
        selectedIndustry?.for_codigo,
        formData.ped_tabela
    );

    // Load existing order
    useEffect(() => {
        if (existingOrder) {
            // Formata a data corretamente
            const formattedOrder = {
                ...existingOrder,
                ped_data: existingOrder.ped_data ? new Date(existingOrder.ped_data).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                ped_cliente: existingOrder.ped_cliente || '',
                ped_transp: existingOrder.ped_transp || '',
                ped_vendedor: existingOrder.ped_vendedor || '',
            };

            setFormData(prev => ({
                ...prev,
                ...formattedOrder,
            }));
            setDisplayNumber(existingOrder.ped_pedido);
            setAllowDuplicates(existingOrder.ped_permiterepe || false);

            if (existingOrder.ped_pedido) {
                loadSummaryItems(existingOrder.ped_pedido);
            }
        } else {
            setFormData(initialFormState);
            setSummaryItems([]);
            setDisplayNumber('(Novo)');
            setAllowDuplicates(false);
            loadNextNumber();
        }
    }, [existingOrder]);

    // Load next order number
    const loadNextNumber = async () => {
        try {
            const data = await orderService.getNextNumber();
            if (data.success) {
                setDisplayNumber(data.data.formatted_number);
            }
        } catch (error) {
            console.error('Error loading next number:', error);
            toast.error('Erro ao buscar próximo número');
        }
    };

    // Load summary items
    const loadSummaryItems = async (orderId = null) => {
        const idToLoad = orderId || formData.ped_pedido;
        if (!idToLoad || idToLoad === '(Novo)' || isSaving) return;

        try {
            const data = await orderService.getItems(idToLoad);
            if (data.success) {
                setSummaryItems(data.data);
            }
        } catch (error) {
            console.error('Error loading summary items:', error);
        }
    };

    // Load items when F1 tab becomes active
    useEffect(() => {
        if (isSaving) return;

        if (activeTab === 'F1' && formData.ped_pedido && formData.ped_pedido !== '(Novo)') {
            loadSummaryItems();
        }
    }, [activeTab, formData.ped_pedido, isSaving]);

    // Reset relevant form fields when industry changes in Insert mode
    useEffect(() => {
        if (!existingOrder && selectedIndustry) {
            setFormData(prev => ({
                ...prev,
                ped_tabela: '',
                ped_pedindu: '',
                // Reset other industry-specific fields if needed
            }));
        }
    }, [selectedIndustry, existingOrder]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            const keys = {
                'F3': 'F3', 'F4': 'F4', 'F5': 'F5',
                'F6': 'F6', 'F7': 'F7', 'F8': 'F8', 'F9': 'F9'
            };

            if (e.key === 'F8') {
                e.preventDefault();
                setOpenCliente(true);
                return;
            }

            if (e.key === 'F10') {
                e.preventDefault();
                handleSave();
                return;
            }

            if (keys[e.key]) {
                e.preventDefault();
                handleTabChange(keys[e.key]);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [formData, selectedIndustry]);

    // Debug: Monitor client loading
    useEffect(() => {
        if (auxData.clients?.length > 0) {
            console.log(`📦 [OrderForm] ${auxData.clients.length} clientes ativos carregados e prontos para busca.`);
        }
    }, [auxData.clients]);

    // Handle save
    const handleSave = async () => {
        setIsSaving(true);
        setLoading(true);

        try {
            const dataToSave = {
                ...formData,
                ped_industria: selectedIndustry?.for_codigo,
                ped_permiterepe: allowDuplicates,
            };

            const result = await orderService.save(dataToSave);

            if (result.success) {
                toast.success(result.message);
                setFormData(prev => ({
                    ...prev,
                    ped_pedido: result.data.ped_pedido,
                    ped_numero: result.data.ped_numero
                }));
                setDisplayNumber(result.data.ped_pedido);

                if (onSave) onSave(result.data);
                return result.data;
            }
        } catch (error) {
            console.error('Error saving order:', error);
            toast.error(error.message || 'Erro ao salvar pedido');
        } finally {
            setLoading(false);
            setTimeout(() => setIsSaving(false), 100);
        }
    };

    // Handle tab change
    const handleTabChange = async (tab) => {
        if (tab === 'F3' && (!formData.ped_pedido || formData.ped_pedido === '(Novo)')) {
            const savedOrder = await handleSave();
            if (savedOrder) {
                await new Promise(resolve => setTimeout(resolve, 100));
                setActiveTab('F3');
            }
        } else {
            setActiveTab(tab);
        }
    };

    // Handle field change
    const handleFieldChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Situação options
    const situacaoOptions = [
        { value: 'P', label: 'Pedido' },
        { value: 'C', label: 'Cotação pendente' },
        { value: 'A', label: 'Cotação confirmada' },
        { value: 'F', label: 'Faturado' },
        { value: 'G', label: 'Garantia' },
        { value: 'B', label: 'Bonificação' },
        { value: 'E', label: 'Excluído' },
    ];

    // Frete options
    const freteOptions = [
        { value: 'C', label: 'CIF' },
        { value: 'F', label: 'FOB' },
    ];

    const inputClasses = "h-7 text-xs font-bold border-emerald-100 focus:border-emerald-500 bg-white placeholder:text-emerald-300 shadow-sm text-black";
    const labelClasses = "text-[10px] text-teal-700 font-bold uppercase tracking-wide mb-0.5 block";

    return (
        <div className="flex flex-col h-full w-full bg-slate-50 relative overflow-hidden">
            <div className="flex flex-col h-full w-full bg-gradient-to-br from-teal-50 to-emerald-50 shadow-inner flex-1 overflow-hidden border-2 border-teal-200 rounded-lg">

                {/* Header - Removed local title bar as requested, using Dialog header only */}

                {/* Main Content Area - Tabs Content */}
                <div className="flex-1 overflow-hidden flex flex-col bg-slate-50 relative">

                    {/* F1: Capa (Principal) */}
                    <div className={cn("absolute inset-0 flex flex-col p-2 gap-2 overflow-auto", activeTab !== 'F1' && "hidden")}>

                        {/* Top Section: Form Fields */}
                        <div className="bg-white border border-emerald-100 rounded-lg p-3 shadow-sm shrink-0">
                            <div className="grid grid-cols-12 gap-3">

                                {/* Left Column: Client & Logistics */}
                                <div className="col-span-12 lg:col-span-8 flex flex-col gap-2">
                                    {/* Row 1: ID, Data, Situation */}
                                    <div className="grid grid-cols-12 gap-2">
                                        <div className="col-span-2">
                                            <Label className={labelClasses}>Pedido</Label>
                                            <Input
                                                value={displayNumber}
                                                readOnly
                                                className={cn(inputClasses, "bg-amber-50 border-amber-200 text-amber-700 font-bold text-center")}
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            <Label className={labelClasses}>Data</Label>
                                            <Input
                                                type="date"
                                                value={formData.ped_data}
                                                onChange={(e) => handleFieldChange('ped_data', e.target.value)}
                                                className={inputClasses}
                                            />
                                        </div>
                                        <div className="col-span-7">
                                            <Label className={labelClasses}>Situação</Label>
                                            <Select
                                                value={formData.ped_situacao}
                                                onValueChange={(value) => handleFieldChange('ped_situacao', value)}
                                            >
                                                <SelectTrigger className={inputClasses}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="z-[9999]" position="popper">
                                                    {situacaoOptions.map((opt) => (
                                                        <SelectItem key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Row 2: Client */}
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between">
                                            <Label className={labelClasses}>Cliente (F8-Pesquisar)</Label>
                                            {formData.ped_cliente && (
                                                <span className="text-[9px] text-teal-600 font-bold bg-teal-50 px-1.5 rounded">ID: {formData.ped_cliente}</span>
                                            )}
                                        </div>
                                        <Popover open={openCliente} onOpenChange={setOpenCliente}>
                                            <PopoverTrigger asChild>
                                                <button
                                                    className={cn(
                                                        "w-full flex items-center justify-between px-3 h-8 rounded-md border text-xs font-bold transition-all duration-200 shadow-sm text-black",
                                                        "bg-white border-emerald-100 hover:border-emerald-300 focus:ring-2 focus:ring-emerald-500/20",

                                                    )}
                                                >
                                                    <span className="truncate">
                                                        {formData.ped_cliente
                                                            ? (auxData.clients || []).find((c) => String(c.cli_codigo) === String(formData.ped_cliente))?.cli_nome ||
                                                            (auxData.clients || []).find((c) => String(c.cli_codigo) === String(formData.ped_cliente))?.cli_nomred ||
                                                            `ID: ${formData.ped_cliente}`
                                                            : "Selecione o cliente..."}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        {auxData.loading && <div className="h-3 w-3 border-2 border-teal-600/30 border-t-teal-600 rounded-full animate-spin" />}
                                                        <Search className="h-4 w-4 text-teal-600 hover:scale-110 transition-transform cursor-pointer" />
                                                    </div>
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[600px] p-0 z-[10000] border-emerald-100 shadow-xl max-h-[300px] overflow-y-auto pointer-events-auto" align="start" sideOffset={8}>
                                                <Command className="pointer-events-auto" shouldFilter={false}>
                                                    <div className="p-2 border-b border-emerald-50 bg-emerald-50/30">
                                                        <CommandInput
                                                            placeholder="Digite nome, CPF/CNPJ ou código... (ESC para fechar)"
                                                            value={clienteSearch}
                                                            onValueChange={setClienteSearch}
                                                            className="h-8 border-emerald-200 focus:ring-0 text-xs font-bold text-black"
                                                            autoFocus
                                                        />
                                                    </div>
                                                    <CommandList className="max-h-[300px] overflow-y-auto">
                                                        <CommandEmpty className="p-4 text-center text-xs text-slate-400">
                                                            {auxData.loading ? "Carregando clientes..." : "Nenhum cliente encontrado."}
                                                        </CommandEmpty>
                                                        <CommandGroup>
                                                            {(() => {
                                                                const filtered = (auxData.clients || []).filter(c =>
                                                                    !clienteSearch ||
                                                                    c.cli_nomred?.toLowerCase().includes(clienteSearch.toLowerCase()) ||
                                                                    c.cli_nome?.toLowerCase().includes(clienteSearch.toLowerCase()) ||
                                                                    c.cli_cnpj?.includes(clienteSearch) ||
                                                                    c.cli_codigo?.toString().includes(clienteSearch)
                                                                );

                                                                if (filtered.length === 0 && !auxData.loading) return null;

                                                                return filtered.slice(0, 80).map((client, index) => (
                                                                    <CommandItem
                                                                        key={`${client.cli_codigo}-${index}`}
                                                                        value={String(client.cli_codigo)}
                                                                        onSelect={() => {
                                                                            handleFieldChange('ped_cliente', client.cli_codigo);
                                                                            handleFieldChange('ped_comprador', client.cli_comprador || '');
                                                                            setOpenCliente(false);
                                                                            setClienteSearch('');
                                                                        }}
                                                                        className="flex items-center gap-3 p-2 cursor-pointer hover:bg-emerald-50/50 data-[disabled]:opacity-100 data-[disabled]:pointer-events-auto"
                                                                    >
                                                                        <div className={cn(
                                                                            "w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0",
                                                                            String(formData.ped_cliente) === String(client.cli_codigo) ? "bg-teal-500 text-white" : "bg-slate-100 text-slate-500"
                                                                        )}>
                                                                            {(client.cli_nomred || client.cli_nome || "?").charAt(0)}
                                                                        </div>
                                                                        <div className="flex flex-col flex-1 overflow-hidden">
                                                                            <div className="flex items-center justify-between gap-2">
                                                                                <span className="font-bold text-slate-700 truncate text-xs">{client.cli_nomred || client.cli_nome}</span>
                                                                                <span className="text-[10px] text-teal-600 font-mono font-bold bg-teal-50 px-1 rounded whitespace-nowrap">ID: {client.cli_codigo}</span>
                                                                            </div>
                                                                            <span className="text-[10px] text-slate-500 truncate">{client.cli_nome}</span>
                                                                            <div className="flex items-center gap-2 text-[9px] text-slate-400 mt-0.5">
                                                                                <span className="font-mono">{client.cli_cnpj || 'Sem CNPJ'}</span>
                                                                                <span className="truncate">• {client.cli_cidade}/{client.cli_uf}</span>
                                                                            </div>
                                                                        </div>
                                                                        {String(formData.ped_cliente) === String(client.cli_codigo) && (
                                                                            <Check className="h-4 w-4 text-teal-600 shrink-0" />
                                                                        )}
                                                                    </CommandItem>
                                                                ));
                                                            })()}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    {/* Row 3: Transporter */}
                                    <div className="flex flex-col gap-1.5">
                                        <Label className={labelClasses}>Transportadora</Label>
                                        <Popover open={openTransp} onOpenChange={setOpenTransp}>
                                            <PopoverTrigger asChild>
                                                <button
                                                    className={cn(
                                                        "w-full flex items-center justify-between px-3 h-8 rounded-md border text-xs font-bold transition-all duration-200 shadow-sm text-black",
                                                        "bg-white border-emerald-100 hover:border-emerald-300 focus:ring-2 focus:ring-emerald-500/20",
                                                        !formData.ped_transp && "text-muted-foreground italic"
                                                    )}
                                                >
                                                    <span className="truncate">
                                                        {formData.ped_transp
                                                            ? (auxData.carriers || []).find((t) => (t.tra_codigo === formData.ped_transp || t.codigo === formData.ped_transp))?.tra_nome ||
                                                            (auxData.carriers || []).find((t) => (t.tra_codigo === formData.ped_transp || t.codigo === formData.ped_transp))?.nome ||
                                                            formData.ped_transp
                                                            : "Selecione a transportadora..."}
                                                    </span>
                                                    <Search className="h-3.5 w-3.5 opacity-50 text-teal-600" />
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[500px] p-0 z-[10000] border-emerald-100 shadow-xl max-h-[300px] overflow-y-auto pointer-events-auto" align="start" sideOffset={8}>
                                                <Command className="pointer-events-auto">
                                                    <div className="p-2 border-b border-emerald-50 bg-emerald-50/30">
                                                        <CommandInput
                                                            placeholder="Buscar transportadora..."
                                                            value={transpSearch}
                                                            onValueChange={setTranspSearch}
                                                            className="h-8 border-emerald-200 focus:ring-0 text-xs font-bold text-black"
                                                        />
                                                    </div>
                                                    <CommandList className="max-h-[200px]">
                                                        <CommandEmpty className="p-4 text-center text-xs text-slate-400">
                                                            {auxData.loading ? "Carregando..." : "Nenhuma transportadora encontrada."}
                                                        </CommandEmpty>
                                                        <CommandGroup>
                                                            {(auxData.carriers || [])
                                                                .filter(t =>
                                                                    !transpSearch ||
                                                                    (t.tra_nome || t.nome || "").toLowerCase().includes(transpSearch.toLowerCase()) ||
                                                                    String(t.tra_codigo || t.codigo || "").includes(transpSearch)
                                                                )
                                                                .map((transp, index) => (
                                                                    <CommandItem
                                                                        key={`${transp.tra_codigo || transp.codigo}-${index}`}
                                                                        value={String(transp.tra_codigo || transp.codigo)}
                                                                        onSelect={() => {
                                                                            handleFieldChange('ped_transp', transp.tra_codigo || transp.codigo);
                                                                            setOpenTransp(false);
                                                                            setTranspSearch('');
                                                                        }}
                                                                        className="flex items-center justify-between p-2 cursor-pointer hover:bg-emerald-50/50 data-[disabled]:opacity-100 data-[disabled]:pointer-events-auto"
                                                                    >
                                                                        <div className="flex flex-col">
                                                                            <span className="font-medium text-slate-700">{transp.tra_nome || transp.nome}</span>
                                                                            <span className="text-[10px] text-slate-400 font-mono">ID: {transp.tra_codigo || transp.codigo}</span>
                                                                        </div>
                                                                        {String(formData.ped_transp) === String(transp.tra_codigo || transp.codigo) && (
                                                                            <Check className="h-4 w-4 text-teal-600 shrink-0" />
                                                                        )}
                                                                    </CommandItem>
                                                                ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    {/* Row 4: Vendedor | Condições */}
                                    <div className="grid grid-cols-12 gap-2">
                                        <div className="col-span-8 flex flex-col gap-1.5">
                                            <Label className={labelClasses}>Vendedor</Label>
                                            <Popover open={openVendedor} onOpenChange={setOpenVendedor}>
                                                <PopoverTrigger asChild>
                                                    <button
                                                        className={cn(
                                                            "w-full flex items-center justify-between px-3 h-8 rounded-md border text-xs font-bold transition-all duration-200 shadow-sm text-black",
                                                            "bg-white border-emerald-100 hover:border-emerald-300 focus:ring-2 focus:ring-emerald-500/20",
                                                            !formData.ped_vendedor && "text-muted-foreground italic"
                                                        )}
                                                    >
                                                        <span className="truncate">
                                                            {formData.ped_vendedor
                                                                ? (auxData.sellers || []).find((s) => (s.ven_codigo === formData.ped_vendedor || s.codigo === formData.ped_vendedor))?.ven_nome ||
                                                                (auxData.sellers || []).find((s) => (s.ven_codigo === formData.ped_vendedor || s.codigo === formData.ped_vendedor))?.nome ||
                                                                formData.ped_vendedor
                                                                : "Selecione o vendedor..."}
                                                        </span>
                                                        <Search className="h-3.5 w-3.5 opacity-50 text-teal-600" />
                                                    </button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[400px] p-0 z-[10000] border-emerald-100 shadow-xl max-h-[300px] overflow-y-auto pointer-events-auto" align="start" sideOffset={8}>
                                                    <Command>
                                                        <div className="p-2 border-b border-emerald-50 bg-emerald-50/30">
                                                            <CommandInput
                                                                placeholder="Buscar vendedor..."
                                                                value={vendedorSearch}
                                                                onValueChange={setVendedorSearch}
                                                                className="h-8 border-emerald-200 focus:ring-0 text-xs font-bold text-black"
                                                            />
                                                        </div>
                                                        <CommandList className="max-h-[200px]">
                                                            <CommandEmpty className="p-4 text-center text-xs text-slate-400">
                                                                {auxData.loading ? "Carregando..." : "Nenhum vendedor encontrado."}
                                                            </CommandEmpty>
                                                            <CommandGroup>
                                                                {(auxData.sellers || [])
                                                                    .filter(s =>
                                                                        !vendedorSearch ||
                                                                        (s.ven_nome || s.nome || "").toLowerCase().includes(vendedorSearch.toLowerCase()) ||
                                                                        String(s.ven_codigo || s.codigo || "").includes(vendedorSearch)
                                                                    )
                                                                    .map((seller, index) => (
                                                                        <CommandItem
                                                                            key={`${seller.ven_codigo || seller.codigo}-${index}`}
                                                                            value={String(seller.ven_codigo || seller.codigo)}
                                                                            onSelect={() => {
                                                                                handleFieldChange('ped_vendedor', seller.ven_codigo || seller.codigo);
                                                                                setOpenVendedor(false);
                                                                                setVendedorSearch('');
                                                                            }}
                                                                            className="flex items-center justify-between p-2 cursor-pointer hover:bg-emerald-50/50 data-[disabled]:opacity-100 data-[disabled]:pointer-events-auto"
                                                                        >
                                                                            <div className="flex flex-col">
                                                                                <span className="font-medium text-slate-700">{seller.ven_nome || seller.nome}</span>
                                                                                <span className="text-[10px] text-slate-400 font-mono">ID: {seller.ven_codigo || seller.codigo}</span>
                                                                            </div>
                                                                            {String(formData.ped_vendedor) === String(seller.ven_codigo || seller.codigo) && (
                                                                                <Check className="h-4 w-4 text-teal-600 shrink-0" />
                                                                            )}
                                                                        </CommandItem>
                                                                    ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <div className="col-span-4 flex flex-col gap-1.5">
                                            <Label className={labelClasses}>Condições</Label>
                                            <Input
                                                value={formData.ped_conpgto || ''}
                                                onChange={(e) => handleFieldChange('ped_conpgto', e.target.value)}
                                                className={inputClasses}
                                            />
                                        </div>
                                    </div>

                                    {/* Row 5: Comprador | Frete */}
                                    <div className="grid grid-cols-12 gap-2">
                                        <div className="col-span-8">
                                            <Label className={labelClasses}>Comprador</Label>
                                            <div className="flex gap-1">
                                                <Input
                                                    value={formData.ped_comprador || ''}
                                                    onChange={(e) => handleFieldChange('ped_comprador', e.target.value)}
                                                    className={inputClasses}
                                                />
                                                <Button variant="outline" size="icon" className="h-7 w-7 shrink-0">
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                                <Button variant="outline" size="icon" className="h-7 w-7 shrink-0">
                                                    <Search className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="col-span-4">
                                            <Label className={labelClasses}>Frete</Label>
                                            <Select
                                                value={formData.ped_frete}
                                                onValueChange={(value) => handleFieldChange('ped_frete', value)}
                                            >
                                                <SelectTrigger className={inputClasses}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="z-[10000]" position="popper">
                                                    {freteOptions.map((opt) => (
                                                        <SelectItem key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Row 6: External IDs */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label className={labelClasses}>Pedido Cliente</Label>
                                            <Input
                                                value={formData.ped_pedcli || ''}
                                                onChange={(e) => handleFieldChange('ped_pedcli', e.target.value)}
                                                className={inputClasses}
                                            />
                                        </div>
                                        <div>
                                            <Label className={labelClasses}>Pedido Indústria</Label>
                                            <Input
                                                value={formData.ped_pedindu || ''}
                                                onChange={(e) => handleFieldChange('ped_pedindu', e.target.value)}
                                                className={inputClasses}
                                            />
                                        </div>
                                    </div>

                                    {/* Observations field integrated into F1 tab */}
                                    <div className="flex flex-col gap-0.5 mt-1">
                                        <Label className={labelClasses}>Observações</Label>
                                        <textarea
                                            value={formData.ped_obs || ''}
                                            onChange={(e) => handleFieldChange('ped_obs', e.target.value)}
                                            className={cn(
                                                "w-full rounded-md border border-emerald-100 bg-white p-2 text-xs",
                                                "focus:border-emerald-500 focus:outline-none shadow-sm min-h-[100px] resize-none text-black text-xs font-bold",
                                                "placeholder:text-emerald-300"
                                            )}
                                            placeholder="Observações do pedido..."
                                        />
                                    </div>
                                </div>

                                {/* Right Column: Financials */}
                                <div className="col-span-12 lg:col-span-4 flex flex-col gap-3 border-l border-dashed border-emerald-200 pl-3">
                                    <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100 shadow-sm">
                                        <Label className={labelClasses}>TABELA DE PREÇO</Label>
                                        <Popover open={openTabela} onOpenChange={setOpenTabela}>
                                            <PopoverTrigger asChild>
                                                <button
                                                    className={cn(
                                                        "w-full flex items-center justify-between px-3 h-8 rounded-md border text-xs font-bold transition-all duration-200 mt-1 text-black",
                                                        "bg-white border-amber-200 hover:border-amber-400 focus:ring-2 focus:ring-amber-500/20",
                                                        !formData.ped_tabela && "text-muted-foreground italic"
                                                    )}
                                                >
                                                    <span className="truncate font-bold text-amber-900">
                                                        {formData.ped_tabela
                                                            ? (auxData.priceTables || []).find((t) => (t.itab_idtabela === formData.ped_tabela || t.nome_tabela === formData.ped_tabela || t.codigo === formData.ped_tabela))?.nome_tabela ||
                                                            (auxData.priceTables || []).find((t) => (t.itab_idtabela === formData.ped_tabela || t.nome_tabela === formData.ped_tabela || t.codigo === formData.ped_tabela))?.itab_nome ||
                                                            formData.ped_tabela
                                                            : "Selecione a tabela..."}
                                                    </span>
                                                    <Search className="h-3.5 w-3.5 opacity-50 text-amber-600" />
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[400px] p-0 z-[10000] border-amber-200 shadow-xl" align="start" sideOffset={8}>
                                                <Command>
                                                    <div className="p-2 border-b border-amber-50 bg-amber-50/30">
                                                        <CommandInput
                                                            placeholder="Buscar tabela..."
                                                            value={tabelaSearch}
                                                            onValueChange={setTabelaSearch}
                                                            className="h-8 border-amber-200 focus:ring-0 text-xs font-bold text-black"
                                                        />
                                                    </div>
                                                    <CommandList className="max-h-[200px]">
                                                        <CommandEmpty className="p-4 text-center text-xs text-slate-400">
                                                            {priceTable.loading || auxData.loading ? "Carregando..." : "Nenhuma tabela encontrada."}
                                                        </CommandEmpty>
                                                        <CommandGroup>
                                                            {(auxData.priceTables || [])
                                                                .filter(t =>
                                                                    !tabelaSearch ||
                                                                    (t.nome_tabela || t.itab_nome || "").toLowerCase().includes(tabelaSearch.toLowerCase()) ||
                                                                    String(t.itab_idtabela || "").includes(tabelaSearch)
                                                                )
                                                                .map((table, index) => {
                                                                    const tableId = table.nome_tabela || table.itab_idtabela; // Use name as ID if needed
                                                                    const tableName = table.nome_tabela || table.itab_nome || tableId;
                                                                    return (
                                                                        <CommandItem
                                                                            key={`${tableId}-${index}`}
                                                                            value={String(tableId)}
                                                                            onSelect={() => {
                                                                                handleFieldChange('ped_tabela', tableId);
                                                                                setOpenTabela(false);
                                                                                setTabelaSearch('');
                                                                            }}
                                                                            className="flex items-center justify-between p-2 cursor-pointer hover:bg-emerald-50/50 data-[disabled]:opacity-100 data-[disabled]:pointer-events-auto"
                                                                        >
                                                                            <div className="flex flex-col">
                                                                                <span className="font-medium text-slate-700">{tableName}</span>
                                                                                <span className="text-[10px] text-slate-400 font-mono">ID: {tableId}</span>
                                                                            </div>
                                                                            {String(formData.ped_tabela) === String(tableId) && (
                                                                                <Check className="h-4 w-4 text-teal-600 shrink-0" />
                                                                            )}
                                                                        </CommandItem>
                                                                    );
                                                                })}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <div className="mt-2 flex justify-between text-[10px] text-amber-600/70 font-medium px-1">
                                            <span>Preços e impostos atualizados</span>
                                            <span className="font-bold text-amber-700 bg-amber-100/50 px-1.5 rounded">
                                                {priceTable.memtable?.length || 0} Ítens
                                            </span>
                                            {priceTable.loading && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
                                        </div>
                                    </div>

                                    {/* Discount Grid */}



                                    <div className="flex justify-between items-center mb-1">
                                        <Label className={labelClasses}>Informe os descontos</Label>
                                        <Button size="sm" variant="ghost" className="h-5 text-[10px] text-emerald-600 px-1"><Plus className="h-3 w-3 mr-1" /> Adicionar</Button>
                                    </div>
                                    <div className="grid grid-cols-4 gap-1">
                                        {[
                                            { key: 'ped_pri', label: '1º' }, { key: 'ped_seg', label: '2º' }, { key: 'ped_ter', label: '3º' },
                                            { key: 'ped_qua', label: '4º' }, { key: 'ped_qui', label: '5º' }, { key: 'ped_sex', label: '6º' },
                                            { key: 'ped_set', label: '7º' }, { key: 'ped_oit', label: '8º' }, { key: 'ped_nov', label: '9º' }
                                        ].map((field) => (
                                            <DiscountInput
                                                key={field.key}
                                                label={field.label}
                                                value={formData[field.key]}
                                                onChange={(val) => handleFieldChange(field.key, val)}
                                            />
                                        ))}
                                    </div>


                                    {/* Checkbox */}
                                    <div className="flex items-center space-x-2 my-2">
                                        <Checkbox
                                            id="allowDuplicates"
                                            checked={allowDuplicates}
                                            onCheckedChange={(checked) => {
                                                setAllowDuplicates(checked);
                                                handleFieldChange('ped_permiterepe', checked);
                                            }}
                                        />
                                        <label
                                            htmlFor="allowDuplicates"
                                            className="text-xs font-bold text-red-600 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Permitir itens repetidos?
                                        </label>
                                    </div>

                                    {/* Totals */}
                                    <div className="grid grid-cols-1 gap-2 mt-auto">
                                        <div className="flex justify-between items-center border-b border-gray-100 pb-1 px-1">
                                            <span className="text-xs text-gray-500 uppercase">Total Bruto</span>
                                            <span className="font-bold text-gray-700">{formatCurrency(formData.ped_totbruto || 0)}</span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-orange-100 pb-1 bg-orange-50/30 px-1 rounded">
                                            <span className="text-xs text-orange-600 uppercase font-bold">Total Líquido</span>
                                            <span className="font-bold text-orange-700">{formatCurrency(formData.ped_totliq || 0)}</span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-emerald-100 pb-1 bg-emerald-50/30 px-1 rounded">
                                            <span className="text-xs text-emerald-600 uppercase font-bold">TOTAL C/IMPOSTOS</span>
                                            <span className="font-bold text-emerald-700">{formatCurrency((formData.ped_totliq || 0) + (formData.ped_totalipi || 0))}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Action Buttons - 2025 Modern Design */}
                        <div className="flex items-center gap-2 p-1 bg-slate-200/50 backdrop-blur-md rounded-2xl border border-slate-300/50 shadow-sm w-fit mt-2 mb-1.5 overflow-x-auto max-w-full">
                            {[
                                { key: 'F1', label: 'F1 - Principal', icon: LayoutDashboard, color: 'emerald' },
                                { key: 'F3', label: 'F3 - Itens', icon: ShoppingCart, color: 'teal' },
                                { key: 'F4', label: 'F4 - Faturas', icon: CreditCard, color: 'blue' },
                                { key: 'F5', label: 'F5 - Conferência', icon: ClipboardCheck, color: 'indigo' },
                                { key: 'F7', label: 'F7 - Faturados', icon: FileCheck, color: 'violet' },
                                { key: 'XX', label: 'XX - Imp. XLS', icon: FileUp, color: 'amber' },
                                { key: '00', label: '00 - Texto', icon: FileJson, color: 'slate' },
                                { key: '01', label: '01 - XML', icon: FileCode, color: 'slate' },
                            ].map(tab => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        onClick={() => handleTabChange(tab.key)}
                                        className={cn(
                                            "group relative flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ease-out",
                                            "text-[11px] font-bold uppercase tracking-tight whitespace-nowrap",
                                            isActive
                                                ? "bg-white text-teal-700 shadow-[0_2px_10px_rgba(0,0,0,0.08)] ring-1 ring-slate-200"
                                                : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
                                        )}
                                    >
                                        <Icon className={cn(
                                            "h-4 w-4 transition-transform duration-300 group-hover:scale-110",
                                            isActive ? "text-teal-600" : "text-slate-400 group-hover:text-slate-600"
                                        )} />
                                        <span>{tab.label}</span>
                                        {isActive && (
                                            <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-teal-500 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.5)]" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Bottom Section: Items Grid (Read Only) */}
                        <div className="flex-1 min-h-[150px] flex flex-col border border-emerald-100 rounded-lg overflow-hidden bg-white shadow-sm">
                            <div className="bg-slate-50 border-b border-slate-100 px-3 py-2 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Package className="h-4 w-4 text-teal-600" />
                                    <h3 className="text-xs font-bold text-teal-800 uppercase tracking-wider">Resumo dos ítens do pedido</h3>
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto">
                                <table className="w-full text-[11px]">
                                    <thead className="bg-[#f1f5f9] text-teal-900 sticky top-0 uppercase text-[9px] font-bold">
                                        <tr className="divide-x divide-slate-200">
                                            <th className="p-1.5 border-b text-left">Seq</th>
                                            <th className="p-1.5 border-b text-left">Código</th>
                                            <th className="p-1.5 border-b text-left">Complem.</th>
                                            <th className="p-1.5 border-b text-left min-w-[150px]">Descrição</th>
                                            <th className="p-1.5 border-b text-center">Quant</th>
                                            <th className="p-1.5 border-b text-right">Unitário</th>
                                            <th className="p-1.5 border-b text-right">Uni. Lq</th>
                                            <th className="p-1.5 border-b text-right">Un. Imp.</th>
                                            <th className="p-1.5 border-b text-right">Total br.</th>
                                            <th className="p-1.5 border-b text-right">Total Liq</th>
                                            <th className="p-1.5 border-b text-right">Tot c/ impos</th>
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                                                <th key={n} className="p-1 border-b text-center w-8">{n}º</th>
                                            ))}
                                            <th className="p-1 border-b text-center text-red-600">IPI</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {summaryItems.length === 0 ? (
                                            <tr>
                                                <td colSpan="21" className="p-8 text-center text-slate-400 italic">
                                                    Nenhum item lançado. Pressione F3 para adicionar.
                                                </td>
                                            </tr>
                                        ) : (
                                            summaryItems.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-emerald-50/50 border-b border-slate-100 transition-colors text-[10px] divide-x divide-slate-50">
                                                    <td className="p-1.5 text-center text-slate-500">{String(item.ite_seq).padStart(3, '0')}</td>
                                                    <td className="p-1.5 font-bold text-blue-600">{item.ite_produto}</td>
                                                    <td className="p-1.5 text-slate-500">{item.ite_complemento}</td>
                                                    <td className="p-1.5 truncate max-w-[200px] font-medium text-slate-700">{item.ite_nomeprod}</td>
                                                    <td className="p-1.5 text-center font-bold text-slate-900">{parseFloat(item.ite_quant || 0).toFixed(1)}</td>
                                                    <td className="p-1.5 text-right text-slate-600">{parseFloat(item.ite_totbruto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                    <td className="p-1.5 text-right font-bold text-emerald-600">{parseFloat(item.ite_puniliq || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                    <td className="p-1.5 text-right text-slate-500">{(parseFloat(item.ite_valcomipi || 0) / (parseFloat(item.ite_quant) || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                    <td className="p-1.5 text-right text-slate-500">{(parseFloat(item.ite_totbruto || 0) * (parseFloat(item.ite_quant) || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                    <td className="p-1.5 text-right font-bold text-emerald-700">{parseFloat(item.ite_totliquido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                    <td className="p-1.5 text-right font-bold text-teal-600">{parseFloat(item.ite_valcomipi || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                                                        <td key={n} className="p-1 text-center text-blue-600 font-medium">
                                                            {parseFloat(item[`ite_des${n}`] || 0) > 0 ? `${parseFloat(item[`ite_des${n}`]).toFixed(2)}%` : '0,00%'}
                                                        </td>
                                                    ))}
                                                    <td className="p-1 text-center font-bold text-red-600 bg-red-50/30">
                                                        {parseFloat(item.ite_ipi || 0) > 0 ? `${parseFloat(item.ite_ipi).toFixed(2)}%` : '0,00%'}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div> {/* End of F1 Tab */}

                    {/* F3: Itens */}
                    <div className={cn("absolute inset-0 flex flex-col", activeTab !== 'F3' && "hidden")}>
                        <OrderItemEntry
                            pedPedido={formData.ped_pedido}
                            selectedIndustry={selectedIndustry?.for_codigo}
                            priceTableName={formData.ped_tabela}
                            priceTableMemtable={priceTable.memtable}
                            memtableLoading={priceTable.loading}
                            headerDiscounts={{
                                ped_pri: formData.ped_pri,
                                ped_seg: formData.ped_seg,
                                ped_ter: formData.ped_ter,
                                ped_qua: formData.ped_qua,
                                ped_qui: formData.ped_qui,
                                ped_sex: formData.ped_sex,
                                ped_set: formData.ped_set,
                                ped_oit: formData.ped_oit,
                                ped_nov: formData.ped_nov
                            }}
                            onItemsChange={(totals, items) => {
                                if (totals) {
                                    setFormData(prev => ({
                                        ...prev,
                                        ped_totbruto: totals.ped_totbruto,
                                        ped_totliq: totals.ped_totliq,
                                        ped_totalipi: totals.ped_totalipi
                                    }));
                                }
                                if (items) {
                                    setSummaryItems(items);
                                }
                            }}
                            allowDuplicates={allowDuplicates}
                        />
                    </div>

                    {/* Other Tabs */}
                    {['F4', 'F5', 'F6', 'F7', 'XX', '00', '01'].map(tab => (
                        <div key={tab} className={cn("absolute inset-0 flex items-center justify-center", activeTab !== tab && "hidden")}>
                            <div className="text-center text-emerald-300">
                                <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-medium">Aba {tab}</p>
                                <p className="text-sm mt-2">Em desenvolvimento...</p>
                            </div>
                        </div>
                    ))}

                </div> {/* End of Main Content */}

                {/* Bottom Toolbar - Absolute fixed at bottom of whole form */}
                <div className="bg-slate-100 border-t border-slate-200 px-4 py-3 flex items-center justify-end gap-3 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] shrink-0 z-50">
                    {activeTab === 'F1' ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={onClose}
                                className="border-slate-300 text-slate-600 hover:bg-slate-50 font-bold h-10 px-6 uppercase tracking-wider transition-all duration-200"
                            >
                                <X className="h-4 w-4 mr-2" />
                                Cancelar (ESC)
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={loading || isSaving}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-8 shadow-md uppercase tracking-wider transition-all duration-200"
                            >
                                {loading || isSaving ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Save className="h-4 w-4 mr-2" />
                                )}
                                Salvar (F10)
                            </Button>
                        </>
                    ) : (
                        <Button
                            variant="outline"
                            onClick={() => setActiveTab('F1')}
                            className="mr-auto border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold h-10 px-6 uppercase tracking-wider transition-all duration-200 bg-white"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2 text-emerald-600" />
                            {'<< '} Voltar
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderForm;
