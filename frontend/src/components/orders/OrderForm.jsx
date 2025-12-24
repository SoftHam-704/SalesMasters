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
    ClipboardCheck, FileCheck, FileUp, FileJson, FileCode
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

const OrderForm = ({ selectedIndustry, onClose, onSave, existingOrder }) => {
    // Display state
    const [displayNumber, setDisplayNumber] = useState('(Novo)');
    const [activeTab, setActiveTab] = useState('F1'); // Default to F1 (Capa) to show the form fields

    // Search state for comboboxes
    const [clienteSearch, setClienteSearch] = useState("");
    const [transpSearch, setTranspSearch] = useState("");
    const [openCliente, setOpenCliente] = useState(false);
    const [openTransp, setOpenTransp] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
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
    });

    // UI state
    const [allowDuplicates, setAllowDuplicates] = useState(false);
    const [loading, setLoading] = useState(false);
    const [summaryItems, setSummaryItems] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    // Popover states
    const [openSituacao, setOpenSituacao] = useState(false);
    const [openVendedor, setOpenVendedor] = useState(false);
    const [openFrete, setOpenFrete] = useState(false);
    const [openTabela, setOpenTabela] = useState(false);

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

            if (keys[e.key]) {
                e.preventDefault();
                handleTabChange(keys[e.key]);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [formData, selectedIndustry]);

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

    const inputClasses = "h-7 text-xs border-emerald-100 focus:border-emerald-500 bg-white placeholder:text-emerald-300 shadow-sm";
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
                                    <div className="flex flex-col gap-0.5">
                                        <Label className={labelClasses}>Cliente (F8-Pesquisar)</Label>
                                        <Popover open={openCliente} onOpenChange={setOpenCliente}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={openCliente}
                                                    className={cn(
                                                        "w-full justify-between font-normal",
                                                        inputClasses,
                                                        !formData.ped_cliente && "text-muted-foreground"
                                                    )}
                                                >
                                                    {formData.ped_cliente
                                                        ? (auxData.clients || []).find((c) => c.cli_codigo === formData.ped_cliente)?.cli_nomered || formData.ped_cliente
                                                        : "Localizar cliente (F8-Pesquisar)"}
                                                    <Search className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[600px] p-0 z-[10000]" align="start" sideOffset={4}>
                                                <Command className="pointer-events-auto">
                                                    <CommandInput placeholder="Buscar cliente..." value={clienteSearch} onValueChange={setClienteSearch} className="pointer-events-auto" />
                                                    <CommandList>
                                                        <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                                                        <CommandGroup>
                                                            {(auxData.clients || []).map((client) => (
                                                                <CommandItem
                                                                    key={client.cli_codigo}
                                                                    value={client.cli_nomered}
                                                                    onSelect={() => {
                                                                        handleFieldChange('ped_cliente', client.cli_codigo || client.codigo);
                                                                        handleFieldChange('ped_comprador', client.cli_comprador || client.comprador || '');
                                                                        setOpenCliente(false);
                                                                    }}
                                                                >
                                                                    <Check className={cn("mr-2 h-4 w-4", formData.ped_cliente === client.cli_codigo ? "opacity-100" : "opacity-0")} />
                                                                    <div className="flex flex-col">
                                                                        <span className="font-bold">{client.cli_nomered}</span>
                                                                        <span className="text-xs text-muted-foreground">{client.cli_cidade}/{client.cli_uf}</span>
                                                                    </div>
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    {/* Row 3: Transporter */}
                                    <div className="flex flex-col gap-0.5">
                                        <Label className={labelClasses}>Transportadora</Label>
                                        <Popover open={openTransp} onOpenChange={setOpenTransp}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={openTransp}
                                                    className={cn(
                                                        "w-full justify-between font-normal",
                                                        inputClasses,
                                                        !formData.ped_transp && "text-muted-foreground"
                                                    )}
                                                >
                                                    {formData.ped_transp
                                                        ? (auxData.carriers || []).find((t) => (t.tra_codigo === formData.ped_transp || t.codigo === formData.ped_transp))?.tra_nome ||
                                                        (auxData.carriers || []).find((t) => (t.tra_codigo === formData.ped_transp || t.codigo === formData.ped_transp))?.nome ||
                                                        formData.ped_transp
                                                        : "Selecione a transportadora..."}
                                                    <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[600px] p-0 z-[10000]" align="start" sideOffset={4}>
                                                <Command>
                                                    <CommandInput placeholder="Buscar transportadora..." value={transpSearch} onValueChange={setTranspSearch} className="pointer-events-auto" />
                                                    <CommandList>
                                                        <CommandEmpty>Nenhuma transportadora encontrada.</CommandEmpty>
                                                        <CommandGroup>
                                                            {(auxData.carriers || []).map((transp) => (
                                                                <CommandItem
                                                                    key={transp.tra_codigo}
                                                                    value={transp.tra_nome}
                                                                    onSelect={() => {
                                                                        handleFieldChange('ped_transp', transp.tra_codigo || transp.codigo);
                                                                        setOpenTransp(false);
                                                                    }}
                                                                    className="pointer-events-auto cursor-pointer"
                                                                >
                                                                    <Check className={cn("mr-2 h-4 w-4", formData.ped_transp === transp.tra_codigo ? "opacity-100" : "opacity-0")} />
                                                                    <div className="flex flex-col">
                                                                        <span>{transp.tra_nome || transp.nome}</span>
                                                                        <span className="text-[10px] text-muted-foreground">{transp.tra_codigo || transp.codigo}</span>
                                                                    </div>
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
                                        <div className="col-span-8">
                                            <Label className={labelClasses}>Vendedor</Label>
                                            <Select
                                                value={formData.ped_vendedor ? formData.ped_vendedor.toString() : ''}
                                                onValueChange={(value) => handleFieldChange('ped_vendedor', parseInt(value))}
                                            >
                                                <SelectTrigger className={inputClasses}>
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                                <SelectContent className="z-[9999]" position="popper">
                                                    {(auxData.sellers || []).map((seller) => (
                                                        <SelectItem key={seller.ven_codigo || seller.codigo} value={(seller.ven_codigo || seller.codigo).toString()}>
                                                            {seller.ven_nome || seller.nome}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-4">
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
                                                "focus:border-emerald-500 focus:outline-none shadow-sm min-h-[100px] resize-none",
                                                "placeholder:text-emerald-300"
                                            )}
                                            placeholder="Observações do pedido..."
                                        />
                                    </div>
                                </div>

                                {/* Right Column: Financials */}
                                <div className="col-span-12 lg:col-span-4 flex flex-col gap-3 border-l border-dashed border-emerald-200 pl-3">
                                    <div className="bg-amber-50/50 p-2 rounded border border-amber-100">
                                        <Label className={labelClasses}>TABELA DE PREÇO</Label>
                                        <Select
                                            value={formData.ped_tabela}
                                            onValueChange={(value) => handleFieldChange('ped_tabela', value)}
                                        >
                                            <SelectTrigger className={cn(inputClasses, "font-medium h-8")}>
                                                <SelectValue placeholder="Selecione a tabela..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {(auxData.priceTables || []).map((table) => (
                                                    <SelectItem key={table.tab_codigo || table.codigo} value={table.tab_codigo || table.codigo}>
                                                        {table.tab_codigo || table.codigo} - {table.tab_descricao || table.descricao}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <div className="mt-1 flex justify-between text-[10px] text-gray-500 px-1">
                                            <span>{priceTable.selectedTable ? priceTable.selectedTable.tab_descricao : '-'}</span>
                                            <span className="font-bold text-teal-700 ml-2">
                                                {priceTable.memtable?.length || 0} itens carregados
                                            </span>
                                            {priceTable.loading && <Loader2 className="h-3 w-3 animate-spin ml-2" />}
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
                                            <div key={field.key} className="flex flex-col items-center">
                                                <span className="text-[9px] text-gray-400 font-bold mb-0.5">{field.label}</span>
                                                <Input
                                                    type="text"
                                                    value={formData[field.key] === 0 ? "0,00%" : (String(formData[field.key]).includes('%') ? formData[field.key] : parseFloat(formData[field.key] || 0).toFixed(2) + '%')}
                                                    onFocus={(e) => {
                                                        // On focus, remove % and show number for editing
                                                        const val = e.target.value.replace('%', '').replace(',', '.');
                                                        e.target.value = val;
                                                        e.target.select();
                                                    }}
                                                    onBlur={(e) => {
                                                        let val = e.target.value.replace('%', '').replace(',', '.');
                                                        const num = parseFloat(val) || 0;
                                                        handleFieldChange(field.key, num);
                                                    }}
                                                    onChange={(e) => {
                                                        // Allow typing, essentially just update local state if needed, or update parent
                                                        // For simplicity with this controlled component approach:
                                                        const val = e.target.value;
                                                        // We don't update main state immediately with raw string to avoid type issues if it expects number
                                                        // But we need to update the UI. 
                                                        // Strategy: Update formData with the raw value? No, formData expects numbers likely.
                                                        // Let's rely on onBlur for the commit to formData, but we need local state for the input if we want complex masking.
                                                        // Simpler: Just rely on onBlur to format.
                                                        handleFieldChange(field.key, val.replace('%', ''));
                                                    }}
                                                    className="h-6 text-center text-xs p-0 border-emerald-100"
                                                />
                                            </div>
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
                                        <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                                            <span className="text-xs text-gray-500 uppercase">Total Bruto</span>
                                            <span className="font-bold text-gray-700">{formatCurrency(formData.ped_totbruto || 0)}</span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-orange-100 pb-1 bg-orange-50/30 px-1 rounded">
                                            <span className="text-xs text-orange-600 uppercase font-bold">Total Líquido</span>
                                            <span className="font-bold text-orange-700">{formatCurrency(formData.ped_totliq || 0)}</span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-emerald-100 pb-1 bg-emerald-50/30 px-1 rounded">
                                            <span className="text-xs text-emerald-600 uppercase font-bold">Total c/ IPI</span>
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
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="border-slate-300 text-slate-600 hover:bg-slate-50 font-bold h-10 px-6 uppercase tracking-wider"
                    >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar (ESC)
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading || isSaving}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-8 shadow-md uppercase tracking-wider"
                    >
                        {loading || isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        Salvar (F10)
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default OrderForm;
