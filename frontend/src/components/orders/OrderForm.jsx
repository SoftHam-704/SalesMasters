import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import {
    Check, X, Plus, Search, Filter, AlertTriangle, ArrowLeft, ArrowRight,
    Calculator, Save, Trash2, Calendar, ShoppingCart, Truck, CreditCard,
    FileText, User, MapPin, MoreHorizontal, FileUp, Copy,
    RefreshCw, Tag, DollarSign, Eraser, StarOff, Percent, HelpCircle, CheckSquare,
    FileJson, FileCode, LayoutDashboard, Loader2, Package, ChevronsUpDown, Edit2, ClipboardCheck, FileCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { IAOrderDialog } from './IAOrderDialog';
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
import { usePriceTable, useAuxData, useCliIndData, useCliAnivData } from '@/hooks/orders';
import { formatCurrency } from '@/utils/orders';
import { BuyerRegistrationDialog } from './BuyerRegistrationDialog';
import ConditionRegistrationDialog from './ConditionRegistrationDialog';



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

    // Dialog States (New Buttons)
    const [showTaxDialog, setShowTaxDialog] = useState(false);
    const [taxValues, setTaxValues] = useState({ ipi: '', st: '' });

    // Discount Dialog State (Button 9)
    const [showDiscountDialog, setShowDiscountDialog] = useState(false);
    const [discountValues, setDiscountValues] = useState({ add: '', esp: '' });

    // F5 Help Dialog State
    const [showF5Help, setShowF5Help] = useState(false);

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
        ped_industria: '',
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
    const [showBuyerDialog, setShowBuyerDialog] = useState(false);
    const [showConditionDialog, setShowConditionDialog] = useState(false);

    // DEBUG: Trace Render
    useEffect(() => {
        console.log(`Render: activeTab=${activeTab}, summaryItems=${summaryItems.length}, importedItems=${importedItems.length}`);
    });

    // Excel Import state (XX tab)
    const [xlsCodigos, setXlsCodigos] = useState('');
    const [xlsComplementos, setXlsComplementos] = useState('');
    const [xlsQuantidades, setXlsQuantidades] = useState('');
    const [xlsPrecos, setXlsPrecos] = useState('');
    const [xlsImporting, setXlsImporting] = useState(false);
    const [xlsErrors, setXlsErrors] = useState([]); // Códigos não encontrados
    const [importedItems, setImportedItems] = useState([]); // Itens vindos da IA
    const importedItemsRef = useRef(importedItems);

    // Sync Ref
    useEffect(() => {
        importedItemsRef.current = importedItems;
    }, [importedItems]);

    // Ref for auto-focus (SetFocus equivalent)
    const dateInputRef = useRef(null);

    // Use custom hooks for data management
    const auxData = useAuxData(formData.ped_industria || selectedIndustry?.for_codigo);
    const priceTable = usePriceTable(
        formData.ped_industria || selectedIndustry?.for_codigo,
        formData.ped_tabela
    );
    const cliIndData = useCliIndData();
    const cliAnivData = useCliAnivData();


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
            // Only reset if we are indeed starting a fresh new order or explicit clear.
            // Check if we are not just in the middle of an import
            // Check ref directly to avoid stale closures or race conditions
            if (importedItemsRef.current.length === 0) {
                setFormData({
                    ...initialFormState,
                    ped_industria: selectedIndustry?.for_codigo || '',
                });
                setSummaryItems([]);
                setDisplayNumber('(Novo)');
                setAllowDuplicates(false);
                loadNextNumber();
            }
        }
    }, [existingOrder, selectedIndustry]); // Removed importedItems from dependency as we check ref

    // DEBUG: Trace ExistingOrder Effect
    useEffect(() => {
        // console.log("🔄 [OrderForm] Effect[existingOrder] triggered. existingOrder:", existingOrder ? "Present" : "Null");
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
        const memItems = importedItemsRef.current;
        console.log(`📥 [loadSummaryItems] called. importedItemsRef=${memItems.length}, orderId=${orderId}`);
        // Se houver itens importados (memoria) e não salvos, mostre-os!
        if (memItems.length > 0) {
            console.log("📦 [OrderForm] Usando itens importados da memória na grid F5 (via REF)");
            setSummaryItems(memItems);
            return;
        }

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

    // Load items when F1 or F5 tab becomes active OR when importedItems changes (IA)
    useEffect(() => {
        if (isSaving) return;

        // F1: Load items if order exists
        if (activeTab === 'F1' && formData.ped_pedido && formData.ped_pedido !== '(Novo)') {
            loadSummaryItems();
        }

        // F5: Load items (from memory or DB)
        // Checks if we are on F5 OR if we just received importedItems while on F5
        if (activeTab === 'F5') {
            loadSummaryItems();
        }
    }, [activeTab, formData.ped_pedido, isSaving, importedItems]);

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

    // Auto-focus on date field when form opens (SetFocus equivalent)
    useEffect(() => {
        // Delay to ensure dialog is rendered
        const timer = setTimeout(() => {
            dateInputRef.current?.focus();
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    // Apply CLI_IND conditions to order form
    const applyCliIndConditions = (conditions) => {
        if (!conditions) return;

        console.log('🎯 [OrderForm] Aplicando condições especiais CLI_IND:', conditions);

        setFormData(prev => ({
            ...prev,
            // Apenas 9 descontos (desc1-desc9) - DECIMAIS (ex: 11.83%)
            ped_pri: parseFloat(conditions.cli_desc1) || prev.ped_pri,
            ped_seg: parseFloat(conditions.cli_desc2) || prev.ped_seg,
            ped_ter: parseFloat(conditions.cli_desc3) || prev.ped_ter,
            ped_qua: parseFloat(conditions.cli_desc4) || prev.ped_qua,
            ped_qui: parseFloat(conditions.cli_desc5) || prev.ped_qui,
            ped_sex: parseFloat(conditions.cli_desc6) || prev.ped_sex,
            ped_set: parseFloat(conditions.cli_desc7) || prev.ped_set,
            ped_oit: parseFloat(conditions.cli_desc8) || prev.ped_oit,
            ped_nov: parseFloat(conditions.cli_desc9) || prev.ped_nov,
            // NOTA: desc10 e desc11 NÃO são mapeados (têm outra finalidade)

            // Transportadora
            ped_transp: conditions.cli_transportadora || prev.ped_transp,

            // Prazo de pagamento
            ped_conpgto: conditions.cli_prazopg || prev.ped_conpgto,

            // Comprador
            ped_comprador: conditions.cli_comprador || prev.ped_comprador,

            // Tipo de frete
            ped_frete: conditions.cli_frete || prev.ped_frete,

            // Tabela de preço especial (se houver)
            ped_tabela: conditions.cli_tabela || prev.ped_tabela,
        }));

        toast.info('✅ Condições especiais aplicadas!', { duration: 2000 });
    };

    // Handle save
    const handleSave = async (options = {}) => {
        console.log("💾 [handleSave] Called");
        const { silent = false } = options;

        // Validação de campos obrigatórios
        const missingFields = [];

        if (!selectedIndustry?.for_codigo) missingFields.push('Indústria');
        if (!formData.ped_cliente) missingFields.push('Cliente');
        if (!formData.ped_transp) missingFields.push('Transportadora');
        if (!formData.ped_tabela) missingFields.push('Tabela de Preço');
        if (!formData.ped_vendedor) missingFields.push('Vendedor');

        if (missingFields.length > 0) {
            toast.error(`Campos obrigatórios não preenchidos: ${missingFields.join(', ')}`);
            return;
        }

        setIsSaving(true);
        setLoading(true);

        try {
            const dataToSave = {
                ...formData,
                ped_industria: selectedIndustry?.for_codigo,
                ped_permiterepe: allowDuplicates,
            };

            const result = await orderService.save(dataToSave);
            const savedPedidoId = result.data?.ped_pedido;

            if (result.success && savedPedidoId) {

                // ---------------------------------------------------------
                // SYNC IMPORTED ITEMS (IA)
                // ---------------------------------------------------------
                if (importedItems.length > 0) {
                    console.log("💾 [handleSave] Sincronizando itens importados da IA...", importedItems.length);
                    try {
                        // 1. Get existing items (to determine sequence)
                        const existingResponse = await fetch(`/api/orders/${savedPedidoId}/items`);
                        const existingJson = existingResponse.ok ? await existingResponse.json() : { data: [] };
                        const existingItems = existingJson.data || []; // API returns { success, data }

                        // 2. Assign sequence numbers
                        let nextSeq = existingItems.length > 0
                            ? Math.max(...existingItems.map(i => i.ite_seq || 0)) + 1
                            : 1;

                        const itemsWithSeq = importedItems.map((item, idx) => ({
                            ...item,
                            ite_seq: nextSeq + idx
                        }));

                        // 3. Merge
                        const allItems = [...existingItems, ...itemsWithSeq];

                        // 4. Send to Sync Endpoint
                        const syncResponse = await fetch(`/api/orders/${savedPedidoId}/items/sync`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(allItems)
                        });

                        if (!syncResponse.ok) throw new Error("Falha ao salvar itens importados.");

                        console.log("✅ [handleSave] Itens salvos com sucesso!");
                        setImportedItems([]); // Clear memory

                    } catch (syncErr) {
                        console.error("❌ [handleSave] Erro ao salvar itens:", syncErr);
                        toast.error("Pedido salvo, mas houve erro ao salvar os itens.");
                    }
                }
                // ---------------------------------------------------------

                toast.success(result.message);
                setFormData(prev => ({
                    ...prev,
                    ped_pedido: result.data.ped_pedido,
                    ped_numero: result.data.ped_numero
                }));
                setDisplayNumber(result.data.ped_pedido);

                // Só chama onSave se não for silent (evita fechar o diálogo quando mudando para F3)
                if (!silent && onSave) onSave(result.data);

                // Reload items specifically to reflect changes (important if we just saved imports)
                if (importedItems.length > 0) {
                    loadSummaryItems(result.data.ped_pedido);
                }

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
        // Abas que manipulam itens (F2=IA, F3=Itens, F5=Conferência, XX=Import XLS) 
        // requerem que o pedido seja salvo primeiro para garantir integridade
        const needsSave = ['F2', 'F3', 'F5', 'XX'].includes(tab);
        const isNew = !formData.ped_pedido || formData.ped_pedido === '(Novo)' || formData.ped_pedido.toString().startsWith('HS');

        if (needsSave && isNew) {
            // Salva com silent=true para não fechar o diálogo
            const savedOrder = await handleSave({ silent: true });
            if (savedOrder) {
                await new Promise(resolve => setTimeout(resolve, 100));
                setActiveTab(tab);
            }
        } else {
            setActiveTab(tab);
        }
    };

    // Handle field change
    const handleFieldChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Helper: calculate item values
    const calculateImportedItem = (item) => {
        const puni = parseFloat(item.ite_puni) || 0;
        const quant = parseFloat(item.ite_quant) || 1;
        const des1 = parseFloat(item.ite_des1) || 0;
        const des2 = parseFloat(item.ite_des2) || 0;
        const des3 = parseFloat(item.ite_des3) || 0;
        const des4 = parseFloat(item.ite_des4) || 0;
        const des5 = parseFloat(item.ite_des5) || 0;
        const des6 = parseFloat(item.ite_des6) || 0;
        const des7 = parseFloat(item.ite_des7) || 0;
        const des8 = parseFloat(item.ite_des8) || 0;
        const des9 = parseFloat(item.ite_des9) || 0;
        const ipiPercent = parseFloat(item.ite_ipi) || 0;
        const stPercent = parseFloat(item.ite_st) || 0;

        // Calculate liquid price with discounts
        let puniliq = puni;
        [des1, des2, des3, des4, des5, des6, des7, des8, des9].forEach(d => {
            if (d > 0) puniliq = puniliq * (1 - d / 100);
        });

        const totbruto = puni * quant;
        const totliquido = puniliq * quant;
        const valcomipi = totliquido * (1 + ipiPercent / 100);
        const valcomst = valcomipi * (1 + stPercent / 100);

        return {
            ...item,
            ite_totbruto: totbruto,
            ite_puniliq: puniliq,
            ite_totliquido: totliquido,
            ite_valcomipi: valcomipi,
            ite_valcomst: valcomst
        };
    };

    // Handle Excel Import
    const handleXlsImport = async () => {
        // Parse lines
        const codigos = xlsCodigos.split('\n').map(l => l.trim()).filter(l => l);
        const complementos = xlsComplementos.split('\n').map(l => l.trim());
        const quantidades = xlsQuantidades.split('\n').map(l => l.trim());
        const precos = xlsPrecos.split('\n').map(l => l.trim());

        if (codigos.length === 0) {
            toast.error('Nenhum código informado');
            return;
        }

        setXlsImporting(true);
        setXlsErrors([]);

        // Ensure order is saved
        // Ensure order is saved
        let currentOrderId = formData.ped_pedido;
        if (!currentOrderId || currentOrderId === '(Novo)') {
            toast.info("Salvando pedido antes de importar itens...");
            const savedData = await handleSave({ silent: true });
            if (savedData?.data?.ped_pedido || savedData?.ped_pedido) {
                currentOrderId = savedData.data?.ped_pedido || savedData.ped_pedido;
            } else {
                setXlsImporting(false);
                return; // Save failed
            }
        }

        try {
            // Get products from price table
            const products = priceTable.memtable || [];
            const foundItems = [];
            const notFoundCodes = [];

            // Process each code
            for (let i = 0; i < codigos.length; i++) {
                const codigo = codigos[i];
                const complemento = complementos[i] || '';
                const quantStr = quantidades[i] || '1';
                const precoStr = precos[i] || '';

                // Find product in price table
                const product = products.find(p =>
                    p.pro_codprod === codigo ||
                    p.pro_codigonormalizado === codigo
                );

                if (!product) {
                    notFoundCodes.push(codigo);
                    continue;
                }

                // Parse quantity (handle comma as decimal separator)
                const quant = parseFloat(quantStr.replace(',', '.')) || 1;

                // Use negotiated price if provided, otherwise use table price
                let precoUnitario = parseFloat(product.itab_precobruto || 0);
                if (precoStr) {
                    precoUnitario = parseFloat(precoStr.replace(',', '.')) || precoUnitario;
                }

                // Create item with header discounts
                const newItem = {
                    ite_industria: selectedIndustry?.for_codigo,
                    ite_produto: product.pro_codprod,
                    ite_idproduto: product.pro_id,
                    ite_embuch: '',
                    ite_nomeprod: product.pro_nome,
                    ite_quant: quant,
                    ite_puni: precoUnitario,
                    ite_ipi: product.itab_ipi || 0,
                    ite_st: product.itab_st || 0,
                    ite_des1: formData.ped_pri || 0,
                    ite_des2: formData.ped_seg || 0,
                    ite_des3: formData.ped_ter || 0,
                    ite_des4: formData.ped_qua || 0,
                    ite_des5: formData.ped_qui || 0,
                    ite_des6: formData.ped_sex || 0,
                    ite_des7: formData.ped_set || 0,
                    ite_des8: formData.ped_oit || 0,
                    ite_des9: formData.ped_nov || 0,
                    ite_des10: 0,
                    ite_promocao: 'N'
                };

                const calculatedItem = calculateImportedItem(newItem);
                foundItems.push(calculatedItem);
            }

            // Show errors if any
            if (notFoundCodes.length > 0) {
                setXlsErrors(notFoundCodes);
            }

            // If we have valid items, sync them
            if (foundItems.length > 0) {
                // Get existing items and merge
                const existingResponse = await fetch(`/api/orders/${currentOrderId}/items`);
                const existingJson = existingResponse.ok ? await existingResponse.json() : { data: [] };
                const existingItems = existingJson.data || []; // API returns { success, data }

                // Assign sequence numbers
                let nextSeq = existingItems.length > 0
                    ? Math.max(...existingItems.map(i => i.ite_seq || 0)) + 1
                    : 1;

                const itemsWithSeq = foundItems.map((item, idx) => ({
                    ...item,
                    ite_seq: nextSeq + idx
                }));

                // Merge with existing items
                const allItems = [...existingItems, ...itemsWithSeq];

                // Stage in Memtable (No Direct Sync)
                setImportedItems(allItems);

                const message = notFoundCodes.length > 0
                    ? `${foundItems.length} itens importados (Memória). ${notFoundCodes.length} códigos não encontrados.`
                    : `${foundItems.length} itens carregados para conferência!`;
                toast.success(message);

                // Clear fields
                setXlsCodigos('');
                setXlsComplementos('');
                setXlsQuantidades('');
                setXlsPrecos('');

                // Navigate to F5 (Conferência) if no errors, otherwise stay to show errors
                if (notFoundCodes.length === 0) {
                    setActiveTab('F5');
                }
            } else if (notFoundCodes.length > 0) {
                toast.error('Nenhum código encontrado na tabela de preços');
            }
        } catch (error) {
            console.error('Error importing items:', error);
            toast.error('Erro ao importar itens: ' + error.message);
        } finally {
            setXlsImporting(false);
        }
    };

    // Handle clear XLS fields
    const handleXlsClear = () => {
        setXlsCodigos('');
        setXlsComplementos('');
        setXlsQuantidades('');
        setXlsPrecos('');
        setXlsErrors([]);
    };

    // Copy errors to clipboard
    const handleCopyErrors = () => {
        const text = xlsErrors.join('\n');
        navigator.clipboard.writeText(text);
        toast.success('Códigos copiados para área de transferência');
    };

    // Helper robusto para recalcular totais de um item do grid F5
    const calculateGridItemTotals = (item) => {
        // Garante valores numéricos
        const parse = (v) => typeof v === 'string' ? parseFloat(v.replace(',', '.') || 0) : (v || 0);

        const puni = parse(item.ite_puni);
        const quant = parse(item.ite_quant);

        let puniliq = puni;

        // Aplica descontos em cascata (1-9)
        for (let i = 1; i <= 9; i++) {
            const des = parse(item[`ite_des${i}`]);
            if (des > 0) puniliq = puniliq * (1 - des / 100);
        }

        // Aplica ESP
        const esp = parse(item.ite_esp);
        if (esp > 0) puniliq = puniliq * (1 - esp / 100);

        // Aplica ADD (ite_des10)
        const add = parse(item.ite_des10);
        if (add > 0) puniliq = puniliq * (1 - add / 100);

        const totbruto = puni * quant;
        const totliquido = puniliq * quant;

        const ipi = parse(item.ite_ipi);
        const st = parse(item.ite_st);

        // Base de cálculo IPI/ST (simplificada, ajustar conforme regras fiscais reais se necessário)
        const valcomipi = totliquido * (1 + ipi / 100);
        const valcomst = valcomipi * (1 + st / 100);

        return {
            ...item,
            ite_puniliq: puniliq,
            ite_totbruto: totbruto,
            ite_totliquido: totliquido,
            ite_valcomipi: valcomipi,
            ite_valcomst: valcomst
        };
    };

    // Função para aplicar atualização de impostos (Botão 5)
    const handleApplyTaxUpdate = () => {
        // Converte valores (aceitando vírgula) e mantém null se vazio
        const parseTax = (val) => {
            if (!val || val.trim() === '') return null;
            return parseFloat(val.replace(',', '.')) || 0;
        };

        const newIpi = parseTax(taxValues.ipi);
        const newSt = parseTax(taxValues.st);

        const updatedItems = summaryItems.map(item => {
            let newItem = { ...item };
            // Atualiza apenas se o usuário digitou algo
            if (newIpi !== null) newItem.ite_ipi = newIpi;
            if (newSt !== null) newItem.ite_st = newSt;

            return calculateGridItemTotals(newItem);
        });

        setSummaryItems(updatedItems);
        toast.success('Impostos (IPI/ST) atualizados em todos os itens!');
        setShowTaxDialog(false);
        setTaxValues({ ipi: '', st: '' }); // Limpa campos
    };

    // Função para aplicar atualização de descontos (Botão 9)
    const handleApplyDiscountUpdate = () => {
        const parseDesc = (val) => {
            if (!val || val.trim() === '') return null;
            return parseFloat(val.replace(',', '.')) || 0;
        };

        const newAdd = parseDesc(discountValues.add);

        const updatedItems = summaryItems.map(item => {
            let newItem = { ...item };
            if (newAdd !== null) newItem.ite_des10 = newAdd;

            // Recalcula string conciliada
            let descontosStr = [];
            for (let i = 1; i <= 9; i++) {
                const d = parseFloat(newItem[`ite_des${i}`] || 0);
                if (d > 0) descontosStr.push(`${d.toFixed(2)}%`);
            }
            const add = parseFloat(newItem.ite_des10 || 0);
            if (add > 0) descontosStr.push(`${add.toFixed(2)}%`);

            newItem.ite_descontos = descontosStr.join('+');

            return calculateGridItemTotals(newItem);
        });

        setSummaryItems(updatedItems);
        toast.success('Descontos (Add/Esp) atualizados em todos os itens!');
        setShowDiscountDialog(false);
        setDiscountValues({ add: '', esp: '' });
    };

    // Helper para salvar itens do grid no backend (Persistência)
    // orderId é opcional: se passado, usa; senão usa formData.ped_pedido
    const saveGridItemsToBackend = async (items, orderId = null) => {
        const targetOrderId = orderId || formData.ped_pedido;
        try {
            const response = await fetch(`/api/orders/${targetOrderId}/items/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(items)
            });
            if (!response.ok) throw new Error('Falha na sincronização');
            return true;
        } catch (error) {
            console.error('Erro ao salvar grid:', error);
            toast.error('Erro ao salvar itens no banco de dados!');
            return false;
        }
    };

    // Handler para os botões de ação da aba F5
    const handleF5Action = async (key) => {
        if (key === '1') { // Atz valores + SALVAR NO BANCO
            try {
                // 1. RECALCULA valores e aplica regras de negócio
                const updatedItems = summaryItems.map(item => {
                    let newItem = { ...item };

                    // Busca produto na tabela para complementar dados (Descrição, Impostos)
                    const product = priceTable.products?.find(p => p.pro_codprod === newItem.ite_produto);

                    if (product) {
                        // preenche descrição se vazia
                        if (!newItem.ite_nomeprod || newItem.ite_nomeprod.trim() === '') {
                            newItem.ite_nomeprod = product.pro_descricao || '';
                        }
                        // preenche impostos se zerados/vazios
                        if (!newItem.ite_ipi || parseFloat(newItem.ite_ipi) === 0) {
                            newItem.ite_ipi = product.pro_ipi || 0;
                        }
                        if (!newItem.ite_st || parseFloat(newItem.ite_st) === 0) {
                            newItem.ite_st = product.pro_st || 0;
                        }
                    }

                    // Regra Promoção: Se "S", zera todos os descontos
                    if (newItem.ite_promocao === 'S') {
                        for (let i = 1; i <= 9; i++) newItem[`ite_des${i}`] = 0;
                        newItem.ite_des10 = 0;
                    }

                    // Gera string concatenada de descontos
                    let descontosStr = [];
                    for (let i = 1; i <= 9; i++) {
                        const d = parseFloat(newItem[`ite_des${i}`] || 0);
                        if (d > 0) descontosStr.push(`${d.toFixed(2)}%`);
                    }
                    const add = parseFloat(newItem.ite_des10 || 0);
                    if (add > 0) descontosStr.push(`${add.toFixed(2)}%`);
                    newItem.ite_descontos = descontosStr.join('+');

                    // Recalcula totais
                    return calculateGridItemTotals(newItem);
                });

                // 2. ATUALIZA memória local
                setSummaryItems(updatedItems);

                // 3. PERSISTE NO BANCO DE DADOS
                console.log(`💾 [F5-BTN1] Salvando ${updatedItems.length} itens no banco...`);

                // Mapear campos do frontend para backend - WHITELIST apenas campos válidos
                const itemsToSave = updatedItems.map(item => ({
                    // Campos de identificação
                    ite_pedido: item.ite_pedido,
                    ite_seq: item.ite_seq,
                    ite_industria: item.ite_industria,
                    ite_idproduto: item.ite_idproduto,
                    ite_produto: item.ite_produto,
                    ite_embuch: item.ite_embuch || '',
                    ite_nomeprod: item.ite_nomeprod || '',
                    ite_grupo: item.ite_grupo,

                    // Valores
                    ite_quant: item.ite_quant || 0,
                    ite_puni: item.ite_puni || 0,
                    ite_totbruto: item.ite_totbruto || 0,
                    ite_puniliq: item.ite_puniliq || 0,
                    ite_totliquido: item.ite_totliquido || 0,
                    ite_ipi: item.ite_ipi || 0,
                    ite_st: item.ite_st || 0,
                    ite_valcomipi: item.ite_valcomipi || 0,
                    ite_valcomst: item.ite_valcomst || 0,

                    // Descontos (1 a 10)
                    ite_des1: item.ite_des1 || 0,
                    ite_des2: item.ite_des2 || 0,
                    ite_des3: item.ite_des3 || 0,
                    ite_des4: item.ite_des4 || 0,
                    ite_des5: item.ite_des5 || 0,
                    ite_des6: item.ite_des6 || 0,
                    ite_des7: item.ite_des7 || 0,
                    ite_des8: item.ite_des8 || 0,
                    ite_des9: item.ite_des9 || 0,
                    ite_des10: item.ite_des10 || 0, // ADD
                    ite_des11: item.ite_esp || 0,   // ESP -> des11

                    // String de descontos concatenados
                    ite_descontos: item.ite_descontos || '',

                    // Outros campos válidos
                    ite_promocao: item.ite_promocao || 'N',
                    ite_obs: item.ite_obs || null,
                    ite_bonificacao: item.ite_bonificacao || false,
                    ite_codbarras: item.ite_codbarras || null,
                    ite_ncm: item.ite_ncm || null,
                    ite_cst: item.ite_cst || null,
                    ite_cfop: item.ite_cfop || null,
                    ite_unidade: item.ite_unidade || null,
                    ite_origem: item.ite_origem || null,
                    ite_pesoitem: item.ite_pesoitem || null,
                    gid: item.gid || null,
                }));

                const response = await fetch(`/api/orders/${formData.ped_pedido}/items/sync`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(itemsToSave)
                });

                const result = await response.json();

                if (result.success) {
                    // 4. ATUALIZA totais do cabeçalho com os valores retornados
                    if (result.totals) {
                        setFormData(prev => ({
                            ...prev,
                            ped_totbruto: result.totals.ped_totbruto || 0,
                            ped_totliq: result.totals.ped_totliq || 0,
                            ped_totalipi: result.totals.ped_totalipi || 0
                        }));
                    }

                    toast.success(`✅ ${updatedItems.length} itens salvos com sucesso!`, { duration: 3000 });
                    console.log('✅ [F5-BTN1] Itens salvos no banco com sucesso!');
                } else {
                    toast.error('Erro ao salvar itens: ' + (result.message || 'Erro desconhecido'));
                    console.error('❌ [F5-BTN1] Erro:', result.message);
                }
            } catch (error) {
                console.error('❌ [F5-BTN1] Erro ao salvar itens:', error);
                toast.error('Erro ao salvar itens no banco de dados');
            }
        } else if (key === '2') { // Desc padrão
            const updatedItems = summaryItems.map(item => {
                let newItem = { ...item };

                // Regra: Se Promoção, zera descontos. Se não, aplica padrão do cabeçalho.
                if (newItem.ite_promocao === 'S') {
                    for (let i = 1; i <= 9; i++) newItem[`ite_des${i}`] = 0;
                    newItem.ite_des10 = 0;
                } else {
                    newItem.ite_des1 = formData.ped_pri || 0;
                    newItem.ite_des2 = formData.ped_seg || 0;
                    newItem.ite_des3 = formData.ped_ter || 0;
                    newItem.ite_des4 = formData.ped_qua || 0;
                    newItem.ite_des5 = formData.ped_qui || 0;
                    newItem.ite_des6 = formData.ped_sex || 0;
                    newItem.ite_des7 = formData.ped_set || 0;
                    newItem.ite_des8 = formData.ped_oit || 0;
                    newItem.ite_des9 = formData.ped_nov || 0;
                }

                // Gera string de descontos
                let descontosStr = [];
                for (let i = 1; i <= 9; i++) {
                    const d = parseFloat(newItem[`ite_des${i}`] || 0);
                    if (d > 0) descontosStr.push(`${d.toFixed(2)}%`);
                }
                const esp = parseFloat(newItem.ite_esp || 0);
                if (esp > 0) descontosStr.push(`${esp.toFixed(2)}%`);

                const add = parseFloat(newItem.ite_des10 || 0);
                if (add > 0) descontosStr.push(`${add.toFixed(2)}%`);

                newItem.ite_descontos = descontosStr.join('+');

                return calculateGridItemTotals(newItem);
            });

            setSummaryItems(updatedItems);
            toast.success('Descontos padrão aplicados (Promoções preservadas zeradas)!');
        } else if (key === '3') { // Desc grupo
            try {
                // Prepara dados para o backend calcular a prioridade de descontos
                const payload = {
                    clientId: formData.ped_cliente,
                    industryId: selectedIndustry?.for_codigo,
                    tableId: formData.ped_tabela,
                    items: summaryItems.map(i => ({ ite_produto: i.ite_produto }))
                };

                const response = await fetch('/api/orders/calculate-group-discounts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();
                if (result.success) {
                    const discountMap = result.data; // map de produtos com descontos aplicaveis

                    const updatedItems = summaryItems.map(item => {
                        const discounts = discountMap[item.ite_produto];

                        // Se backend retornou desconto para este produto, aplica
                        if (discounts) {
                            let newItem = { ...item };

                            // Aplica os 9 campos de desconto retornados (sobrescreve anteriores)
                            for (let i = 1; i <= 9; i++) {
                                newItem[`ite_des${i}`] = discounts[`ite_des${i}`] || 0;
                            }

                            // Recalcula string conciliada
                            let descontosStr = [];
                            for (let i = 1; i <= 9; i++) {
                                const d = parseFloat(newItem[`ite_des${i}`] || 0);
                                if (d > 0) descontosStr.push(`${d.toFixed(2)}%`);
                            }
                            const esp = parseFloat(newItem.ite_esp || 0);
                            if (esp > 0) descontosStr.push(`${esp.toFixed(2)}%`);
                            const add = parseFloat(newItem.ite_des10 || 0);
                            if (add > 0) descontosStr.push(`${add.toFixed(2)}%`);

                            newItem.ite_descontos = descontosStr.join('+');

                            return calculateGridItemTotals(newItem);
                        }
                        return item;
                    });

                    setSummaryItems(updatedItems);
                    toast.success('Descontos por grupo aplicados (Prioridade: Cliente > Tabela)!');
                } else {
                    toast.error('Ocorreu um erro ao calcular descontos de grupo.');
                }
            } catch (err) {
                console.error(err);
                toast.error('Erro de comunicação com o servidor');
            }
        } else if (key === '4') { // Atz tab nova
            const updatedItems = summaryItems.map(item => {
                let newItem = { ...item };

                // Busca o produto na tabela de preços ATUALMENTE carregada (priceTable)
                // O hook usePriceTable já atualiza priceTable.products quando formData.ped_tabela muda
                const product = priceTable.products?.find(p => p.pro_codprod === newItem.ite_produto);

                if (product) {
                    // Atualiza o Preço Unitário (Bruto) com o valor da nova tabela
                    newItem.ite_puni = product.pro_preco1 || 0;

                    // "Nesse caso o preço especial é ignorado"
                    // Interpretação: Zerar desconto especial e garantir que não estamos puxando preço promocional se houver check na tabela
                    // Estamos pegando o pro_preco1 (cheio)
                    newItem.ite_esp = 0;

                    // Nota: Se o item tinha promoção ('S'), mantemos a flag? 
                    // O usuário disse "preço promocional... preço especial ignorado".
                    // Vou manter a flag de promoção do ITEM se ela vier do produto, mas o preço base é o atualizado.
                }

                return calculateGridItemTotals(newItem);
            });

            setSummaryItems(updatedItems);
            toast.success('Preços brutos atualizados conforme a Tabela Selecionada!');
            setSummaryItems(updatedItems);
            toast.success('Preços brutos atualizados conforme a Tabela Selecionada!');
        } else if (key === '5') { // Atz IPI/ST
            setShowTaxDialog(true);
        } else if (key === '6') { // Volta Padrão (Preço Bruto)
            const updatedItems = summaryItems.map(item => {
                let newItem = { ...item };
                const product = priceTable.products?.find(p => p.pro_codprod === newItem.ite_produto);

                if (product) {
                    // "substituir todos os preços brutos pelo campo itab_precobruto mesmo que estiver em branco"
                    // Prioriza itab_precobruto se existir, senão pro_preco1
                    const tablePrice = product.itab_precobruto !== undefined ? product.itab_precobruto : product.pro_preco1;

                    // Atualiza ite_puni (Bruto)
                    newItem.ite_puni = tablePrice || 0;
                }

                return calculateGridItemTotals(newItem);
            });

            setSummaryItems(updatedItems);
            toast.success('Todos os preços foram revertidos para o valor da Tabela!');
            setSummaryItems(updatedItems);
            toast.success('Todos os preços foram revertidos para o valor da Tabela!');
        } else if (key === '9') { // Desc Add / Esp
            setShowDiscountDialog(true);
        } else if (key === '7') { // Último Preço Negociado
            try {
                const payload = {
                    clientId: formData.ped_cliente,
                    industryId: selectedIndustry?.for_codigo,
                    productCodes: summaryItems.map(i => i.ite_produto)
                };

                const response = await fetch('/api/orders/batch-last-prices', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();
                if (result.success) {
                    const priceMap = result.data;

                    const updatedItems = summaryItems.map(item => {
                        const lastPrice = priceMap[item.ite_produto];
                        if (lastPrice !== undefined) {
                            let newItem = { ...item };
                            newItem.ite_puni = lastPrice; // Substitui preço bruto
                            return calculateGridItemTotals(newItem);
                        }
                        return item;
                    });

                    setSummaryItems(updatedItems);
                    toast.success('Preços atualizados com base no histórico de compras do cliente!');
                } else {
                    toast.error('Erro ao buscar histórico de preços.');
                }
            } catch (err) {
                console.error(err);
                toast.error('Erro de comunicação para buscar histórico.');
            }
        } else if (key === '8') { // Força Desc Padrão (Sem respeitar promoção)
            const updatedItems = summaryItems.map(item => {
                let newItem = { ...item };

                // Aplica sempre, independente de ite_promocao
                newItem.ite_des1 = formData.ped_pri || 0;
                newItem.ite_des2 = formData.ped_seg || 0;
                newItem.ite_des3 = formData.ped_ter || 0;
                newItem.ite_des4 = formData.ped_qua || 0;
                newItem.ite_des5 = formData.ped_qui || 0;
                newItem.ite_des6 = formData.ped_sex || 0;
                newItem.ite_des7 = formData.ped_set || 0;
                newItem.ite_des8 = formData.ped_oit || 0;
                newItem.ite_des9 = formData.ped_nov || 0;

                // String descontos
                let descontosStr = [];
                for (let i = 1; i <= 9; i++) {
                    const d = parseFloat(newItem[`ite_des${i}`] || 0);
                    if (d > 0) descontosStr.push(`${d.toFixed(2)}%`);
                }
                const add = parseFloat(newItem.ite_des10 || 0);
                if (add > 0) descontosStr.push(`${add.toFixed(2)}%`);

                newItem.ite_descontos = descontosStr.join('+');

                return calculateGridItemTotals(newItem);
            });

            setSummaryItems(updatedItems);
            setSummaryItems(updatedItems);
            toast.success('Descontos padrão aplicados a TODOS os itens (Forçado)!');
        } else if (key === 'C') { // Cód Original -> ite_embuch (Botão C)
            try {
                const payload = {
                    industryId: selectedIndustry?.for_codigo,
                    productCodes: summaryItems.map(i => i.ite_produto)
                };

                const response = await fetch('/api/orders/batch-original-codes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();
                if (result.success) {
                    const dataMap = result.data;
                    const updatedItems = summaryItems.map(item => {
                        const info = dataMap[item.ite_produto];
                        if (info && info.originalCode) {
                            return { ...item, ite_embuch: info.originalCode };
                        }
                        return item;
                    });
                    setSummaryItems(updatedItems);
                    toast.success('Campo Embuch atualizado com Códigos Originais!');
                } else {
                    toast.error('Erro ao buscar códigos originais.');
                }
            } catch (err) {
                console.error(err);
                toast.error('Erro de comunicação (Botão 0).');
            }

        } else if (key === 'A') { // Ajuste Múltiplos
            try {
                const payload = {
                    industryId: selectedIndustry?.for_codigo,
                    productCodes: summaryItems.map(i => i.ite_produto)
                };

                const response = await fetch('/api/orders/batch-original-codes', { // Reutiliza endpoint para pegar embalagem
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();
                if (result.success) {
                    const dataMap = result.data;
                    let count = 0;
                    const updatedItems = summaryItems.map(item => {
                        const info = dataMap[item.ite_produto];
                        if (info && info.packaging) {
                            const pack = parseFloat(info.packaging);
                            const qty = parseFloat(item.ite_quant || 0);

                            if (pack > 0 && qty > 0) {
                                const remainder = qty % pack;
                                if (remainder !== 0) {
                                    // Ajusta para o próximo múltiplo
                                    const newQty = Math.ceil(qty / pack) * pack;
                                    count++;
                                    let newItem = { ...item, ite_quant: newQty };
                                    return calculateGridItemTotals(newItem);
                                }
                            }
                        }
                        return item;
                    });

                    if (count > 0) {
                        setSummaryItems(updatedItems);
                        toast.success(`${count} itens ajustados para múltiplos da embalagem!`);
                    } else {
                        toast.info('Nenhum item precisou de ajuste de múltiplo.');
                    }
                } else {
                    toast.error('Erro ao buscar dados de embalagem.');
                }
            } catch (err) {
                console.error(err);
                toast.error('Erro de comunicação (Botão A).');
            }

        } else if (key === 'B') {
            toast.info('Botão B (% por qtd) será implementado futuramente.');

        } else {
            toast.info(`Funcionalidade do botão ${key} em desenvolvimento`);
        }
    };

    // Função para tratar a edição direta no grid de conferência
    const handleGridEdit = (idx, field, value) => {
        const newItems = [...summaryItems];
        // Atualiza campo específico (mantendo string se for input controlado)
        // Mantém como string para permitir formatação visual (ex: "10.00") e digitação ("10.")
        if (field === 'ite_embuch') {
            newItems[idx] = { ...newItems[idx], [field]: value };
        } else {
            // Aceita input formatado, troca virgula por ponto
            let cleanValue = value;
            if (typeof value === 'string') {
                cleanValue = value.replace(/[^0-9.,-]/g, '').replace(',', '.');
            }
            newItems[idx] = { ...newItems[idx], [field]: cleanValue };
        }

        // Se alterou campos que afetam totais, recalcula tudo
        if (['ite_puni', 'ite_quant', 'ite_des1', 'ite_des2', 'ite_des3', 'ite_des4',
            'ite_des5', 'ite_des6', 'ite_des7', 'ite_des8', 'ite_des9',
            'ite_des10', 'ite_ipi', 'ite_st'].includes(field) || field.startsWith('ite_des')) {
            newItems[idx] = calculateGridItemTotals(newItems[idx]);
        }

        setSummaryItems(newItems);
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
                                                ref={dateInputRef}
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
                                                                        onSelect={async () => {
                                                                            handleFieldChange('ped_cliente', client.cli_codigo);

                                                                            // Buscar condições CLI_IND apenas em modo INSERT
                                                                            if (!existingOrder && selectedIndustry?.for_codigo) {
                                                                                try {
                                                                                    const conditions = await cliIndData.fetchConditions(
                                                                                        client.cli_codigo,
                                                                                        selectedIndustry.for_codigo
                                                                                    );

                                                                                    if (conditions) {
                                                                                        applyCliIndConditions(conditions);

                                                                                        // FALLBACK: Se comprador estiver vazio, buscar em CLI_ANIV
                                                                                        if (!conditions.cli_comprador) {
                                                                                            try {
                                                                                                console.log('🔄 [OrderForm] Comprador vazio, buscando em CLI_ANIV...');
                                                                                                const buyer = await cliAnivData.fetchBuyer(client.cli_codigo);

                                                                                                if (buyer) {
                                                                                                    handleFieldChange('ped_comprador', buyer.nome);
                                                                                                    console.log(`✅ [OrderForm] Comprador encontrado: ${buyer.nome}`);
                                                                                                }
                                                                                            } catch (error) {
                                                                                                console.error('Erro ao buscar comprador em CLI_ANIV:', error);
                                                                                            }
                                                                                        }
                                                                                    } else {
                                                                                        // Se CLI_IND não retornou nada, buscar direto em CLI_ANIV
                                                                                        try {
                                                                                            console.log('🔄 [OrderForm] CLI_IND vazio, buscando comprador em CLI_ANIV...');
                                                                                            const buyer = await cliAnivData.fetchBuyer(client.cli_codigo);

                                                                                            if (buyer) {
                                                                                                handleFieldChange('ped_comprador', buyer.nome);
                                                                                                console.log(`✅ [OrderForm] Comprador encontrado: ${buyer.nome}`);
                                                                                            }
                                                                                        } catch (error) {
                                                                                            console.error('Erro ao buscar comprador em CLI_ANIV:', error);
                                                                                        }
                                                                                    }
                                                                                } catch (error) {
                                                                                    console.error('Erro ao buscar CLI_IND:', error);
                                                                                    // Continue sem condições especiais
                                                                                }
                                                                            }

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
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-7 w-7 shrink-0"
                                                    onClick={() => setShowBuyerDialog(true)}
                                                    type="button"
                                                >
                                                    <Plus className="h-3 w-3" />
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
                                            { key: 'ped_set', label: '7º' }, { key: 'ped_oit', label: '8º' }
                                        ].map((field) => (
                                            <DiscountInput
                                                key={field.key}
                                                label={field.label}
                                                value={formData[field.key]}
                                                onChange={(val) => handleFieldChange(field.key, val)}
                                            />
                                        ))}
                                        {/* 9º Desconto com botão 'Tornar Padrão' */}
                                        <div className="col-span-2 flex gap-2 items-end">
                                            <DiscountInput
                                                label="9º"
                                                value={formData.ped_nov}
                                                onChange={(val) => handleFieldChange('ped_nov', val)}
                                            />
                                            <Button
                                                size="sm"
                                                className="h-6 mb-0 bg-emerald-600 text-white hover:bg-emerald-700 text-[10px] font-bold px-2 shadow-sm border border-emerald-700"
                                                onClick={() => {
                                                    setShowConditionDialog(true);
                                                }}
                                                type="button"
                                            >
                                                Tornar Padrão
                                            </Button>
                                        </div>
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

                        {/* Navigation Action Buttons - 2025 Modern Design Unified */}
                        <div className="flex items-center gap-1 p-1 bg-slate-200/50 backdrop-blur-md rounded-2xl border border-slate-300/50 shadow-sm w-full mt-2 mb-1.5">
                            {[
                                { key: 'F1', label: 'F1 - Principal', icon: LayoutDashboard, color: 'emerald' }
                            ].map(tab => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        onClick={() => handleTabChange(tab.key)}
                                        className={cn(
                                            "group relative flex-1 flex items-center justify-center gap-2 px-2 py-2 rounded-[10px] transition-all duration-300 ease-out h-[36px] border border-slate-200",
                                            "text-[10px] font-bold uppercase tracking-tight whitespace-nowrap",
                                            isActive
                                                ? "bg-white text-teal-700 shadow-[0_2px_8px_rgba(59,130,246,0.12)] border-blue-200 ring-1 ring-blue-100"
                                                : "bg-white text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 hover:shadow"
                                        )}
                                    >
                                        <Icon className={cn(
                                            "h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-6",
                                            isActive ? "text-teal-600" : "text-slate-400 group-hover:text-blue-500"
                                        )} />
                                        <span>{tab.label}</span>
                                        {isActive && (
                                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-teal-500 rounded-full" />
                                        )}
                                    </button>
                                );
                            })}

                            {/* IA Order Button Replacement for F2 */}
                            <div className="mx-1">
                                <IAOrderDialog
                                    disabled={false} // Always enabled to allow clicking and showing ID
                                    orderId={formData.ped_pedido}
                                    orderNumber={formData.ped_numero} // Pass display number
                                    onOrderGenerated={async (items) => {
                                        // STANDARD FLOW: Save Header -> Sync Items -> Refresh F5
                                        // 1. Ensure Order is Saved before importing items
                                        // 1. Ensure Order is Saved before importing items
                                        let currentOrderId = formData.ped_pedido;
                                        if (!currentOrderId || currentOrderId === '(Novo)') {
                                            toast.info("Salvando pedido antes de importar itens da IA...");
                                            const savedData = await handleSave({ silent: true });
                                            // handleSave likely updates formData state, but we need the ID now.
                                            // Ensure handleSave returns the backend response with ped_pedido
                                            if (savedData?.data?.ped_pedido || savedData?.ped_pedido) {
                                                currentOrderId = savedData.data?.ped_pedido || savedData.ped_pedido;
                                            } else {
                                                console.error("❌ Failed to save order. Aborting import.");
                                                toast.error("Erro ao salvar o cabeçalho do pedido.");
                                                return false;
                                            }
                                        }

                                        // FINAL SAFEGUARD: If ID is still invalid, STOP.
                                        if (!currentOrderId || currentOrderId === '(Novo)') {
                                            console.error("❌ [IA Import] Critical Error: Invalid Order ID after save attempt:", currentOrderId);
                                            toast.error("Erro Crítico: ID do pedido inválido. Tente salvar manualmente.");
                                            return false;
                                        }

                                        try {
                                            const foundItems = items;
                                            const products = priceTable?.memtable || [];

                                            if (products.length === 0) {
                                                console.error("❌ [IA Import] Tabela de preço VAZIA.");
                                                toast.error("Erro: A Tabela de Preço não foi carregada.");
                                                return false;
                                            }

                                            const finalImportItems = [];
                                            const notFoundInTable = [];

                                            // Get existing items count to assign correct sequence
                                            const existingItemsRes = await fetch(`/api/orders/${currentOrderId}/items`);
                                            const existingItemsResponse = existingItemsRes.ok ? await existingItemsRes.json() : {};
                                            const existingItems = existingItemsResponse.success ? existingItemsResponse.data : [];

                                            let nextSeq = existingItems.length > 0
                                                ? Math.max(...existingItems.map(i => i.ite_seq || 0)) + 1
                                                : 1;

                                            for (const item of foundItems) {
                                                const product = products.find(p =>
                                                    String(p.pro_codprod) === String(item.codigo) ||
                                                    String(p.pro_codigonormalizado) === String(item.codigo)
                                                );

                                                if (!product) {
                                                    notFoundInTable.push(item.codigo);
                                                    continue;
                                                }

                                                const newItem = {
                                                    ite_seq: nextSeq++,
                                                    ite_industria: selectedIndustry?.for_codigo,
                                                    ite_produto: product.pro_codprod,
                                                    ite_idproduto: product.pro_id,
                                                    ite_embuch: '',
                                                    ite_nomeprod: product.pro_nome,
                                                    ite_quant: parseFloat(item.quantidade) || 1,
                                                    ite_puni: item.preco ? parseFloat(item.preco) : parseFloat(product.itab_precobruto || 0),
                                                    ite_ipi: product.itab_ipi || 0,
                                                    ite_st: product.itab_st || 0,
                                                    ite_des1: formData.ped_pri || 0,
                                                    ite_des2: formData.ped_seg || 0,
                                                    ite_des3: formData.ped_ter || 0,
                                                    ite_des4: formData.ped_qua || 0,
                                                    ite_des5: formData.ped_qui || 0,
                                                    ite_des6: formData.ped_sex || 0,
                                                    ite_des7: formData.ped_set || 0,
                                                    ite_des8: formData.ped_oit || 0,
                                                    ite_des9: formData.ped_nov || 0,
                                                    ite_des10: 0,
                                                    ite_promocao: 'N'
                                                };

                                                const calculatedItem = calculateImportedItem(newItem);
                                                finalImportItems.push(calculatedItem);
                                            }

                                            if (notFoundInTable.length > 0) {
                                                console.warn("❌ Items not in PriceTable:", notFoundInTable);
                                                toast.warning(`${notFoundInTable.length} itens não encontrados na tabela de preços.`);
                                            }

                                            if (finalImportItems.length === 0) {
                                                toast.error("Nenhum item pôde ser importado.");
                                                return false;
                                            }

                                            // 2. SYNC TO DB (Merge with existing)
                                            const allItems = [...existingItems, ...finalImportItems];

                                            // Sync removed (using memtable)
                                            const syncResponse = { ok: true };
                                            // const syncResponse = await fetch(`/api/orders/${currentOrderId}/items/sync`, {
                                            //    method: 'POST',
                                            // 2. STAGE IN MEMTABLE (Merge with existing)
                                            const allMemItems = [...existingItems, ...finalImportItems];

                                            console.log("📦 [IA Import] Defined final items in memory:", allMemItems.length);

                                            // FORCE UPDATE BOTH STATES
                                            importedItemsRef.current = allMemItems; // SYNC UPDATE: Critical for effect checks
                                            setImportedItems(allMemItems);
                                            setSummaryItems(allMemItems); // Force grid update immediately

                                            // Syncing to DB is now deferred to "Save" or "Update Values" in F5

                                            toast.success(
                                                `✨ ${finalImportItems.length} itens carregados para conferência!`,
                                                { duration: 3000 }
                                            );

                                            setTimeout(() => {
                                                setActiveTab('F5');
                                            }, 500);

                                            return true;

                                        } catch (error) {
                                            console.error('❌ [IA Import] Error:', error);
                                            toast.error('Erro ao processar importação IA: ' + error.message);
                                            return false;
                                        }
                                    }} />
                            </div>

                            {[
                                { key: 'F3', label: 'F3 - Itens', icon: ShoppingCart, color: 'teal' },
                                { key: 'F4', label: 'F4 - Faturas', icon: CreditCard, color: 'blue' },
                                { key: 'F5', label: 'F5 - Conferência', icon: ClipboardCheck, color: 'orange', highlight: true },
                                { key: 'F7', label: 'F7 - Faturados', icon: FileCheck, color: 'violet' },
                                { key: 'XX', label: 'XX - Imp. XLS', icon: FileUp, color: 'amber' },
                                { key: '01', label: '01 - LOAD XML', icon: FileCode, color: 'slate' },
                            ].map(tab => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.key;
                                const isHighlight = tab.highlight;
                                const buttonColor = tab.color;

                                return (
                                    <button
                                        key={tab.key}
                                        onClick={() => handleTabChange(tab.key)}
                                        className={cn(
                                            "group relative flex-1 flex items-center justify-center gap-2 px-2 py-2 rounded-[10px] transition-all duration-300 ease-out h-[36px] border",
                                            "text-[10px] font-bold uppercase tracking-tight whitespace-nowrap",
                                            isActive
                                                ? isHighlight
                                                    ? "bg-orange-500 text-white border-orange-600 shadow-md ring-2 ring-orange-200" // Highlight Active (Keep Original Punch)
                                                    : "bg-white text-teal-700 shadow-[0_2px_8px_rgba(59,130,246,0.12)] border-blue-200 ring-1 ring-blue-100" // Normal Active (White base)
                                                : isHighlight
                                                    ? "bg-white text-orange-600 border-orange-200 shadow-sm hover:bg-orange-50 hover:border-orange-300" // Highlight Inactive (White base with accent)
                                                    : "bg-white text-slate-600 border-slate-200 shadow-sm hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 hover:shadow" // Normal Inactive (White base)
                                        )}
                                    >
                                        <Icon className={cn(
                                            "h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-6",
                                            isActive
                                                ? isHighlight ? "text-white" : "text-teal-600"
                                                : isHighlight ? "text-orange-500" : "text-slate-400 group-hover:text-blue-500"
                                        )} />
                                        <span>{tab.label}</span>
                                        {isActive && !isHighlight && (
                                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-teal-500 rounded-full" />
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
                                                    <td className="p-1.5 text-slate-500">{item.ite_embuch}</td>
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
                            selectedIndustry={formData.ped_industria || selectedIndustry?.for_codigo}
                            priceTableName={formData.ped_tabela}
                            priceTableMemtable={priceTable.memtable}
                            memtableLoading={priceTable.loading}
                            importedItems={importedItems}
                            onImportComplete={() => setImportedItems([])}
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
                            pedCliente={formData.ped_cliente}
                            entrySpeed={4} // TODO: Get from user parameters (par_qtdenter)
                        />
                    </div>

                    {/* XX: Importação XLS */}
                    <div className={cn("absolute inset-0 flex flex-col p-4 gap-4 overflow-hidden", activeTab !== 'XX' && "hidden")}>
                        {/* Header */}
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 shadow-sm">
                            <div className="flex items-center gap-3">
                                <FileUp className="h-6 w-6 text-amber-600" />
                                <div>
                                    <h3 className="text-sm font-bold text-amber-800 uppercase">Importação via Excel</h3>
                                    <p className="text-xs text-amber-600">Cole os dados das colunas do Excel nos campos abaixo. Cada linha representa um item.</p>
                                </div>
                            </div>
                        </div>

                        {/* 4 Panels - Horizontal Layout */}
                        <div className="flex-1 flex gap-3 overflow-hidden">
                            {/* Panel 1: Códigos */}
                            <div className="flex-1 flex flex-col border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                                <div className="bg-teal-600 px-3 py-2">
                                    <h4 className="text-xs font-bold text-white uppercase tracking-wide">1. Códigos</h4>
                                </div>
                                <textarea
                                    value={xlsCodigos}
                                    onChange={(e) => setXlsCodigos(e.target.value)}
                                    placeholder="Cole aqui os códigos dos produtos (um por linha)..."
                                    className="flex-1 p-3 text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-teal-200 border-none"
                                />
                                <div className="bg-slate-50 px-3 py-1 border-t border-slate-100">
                                    <span className="text-[10px] text-slate-400">{xlsCodigos.split('\n').filter(l => l.trim()).length} linhas</span>
                                </div>
                            </div>

                            {/* Panel 2: Complementos */}
                            <div className="flex-1 flex flex-col border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                                <div className="bg-blue-600 px-3 py-2">
                                    <h4 className="text-xs font-bold text-white uppercase tracking-wide">2. Complementos</h4>
                                </div>
                                <textarea
                                    value={xlsComplementos}
                                    onChange={(e) => setXlsComplementos(e.target.value)}
                                    placeholder="Cole aqui os complementos (ite_embuch)..."
                                    className="flex-1 p-3 text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 border-none"
                                />
                                <div className="bg-slate-50 px-3 py-1 border-t border-slate-100">
                                    <span className="text-[10px] text-slate-400">{xlsComplementos.split('\n').filter(l => l.trim()).length} linhas</span>
                                </div>
                            </div>

                            {/* Panel 3: Quantidades */}
                            <div className="flex-1 flex flex-col border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                                <div className="bg-emerald-600 px-3 py-2">
                                    <h4 className="text-xs font-bold text-white uppercase tracking-wide">3. Quantidades</h4>
                                </div>
                                <textarea
                                    value={xlsQuantidades}
                                    onChange={(e) => setXlsQuantidades(e.target.value)}
                                    placeholder="Cole aqui as quantidades (uma por linha)..."
                                    className="flex-1 p-3 text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-emerald-200 border-none"
                                />
                                <div className="bg-slate-50 px-3 py-1 border-t border-slate-100">
                                    <span className="text-[10px] text-slate-400">{xlsQuantidades.split('\n').filter(l => l.trim()).length} linhas</span>
                                </div>
                            </div>

                            {/* Panel 4: Preços Unitários (Opcional) */}
                            <div className="flex-1 flex flex-col border border-amber-200 rounded-lg overflow-hidden bg-amber-50/30 shadow-sm">
                                <div className="bg-amber-500 px-3 py-2">
                                    <h4 className="text-xs font-bold text-white uppercase tracking-wide">4. Preços (Opcional)</h4>
                                </div>
                                <textarea
                                    value={xlsPrecos}
                                    onChange={(e) => setXlsPrecos(e.target.value)}
                                    placeholder="Cole aqui os preços unitários negociados (opcional - substitui o preço da tabela)..."
                                    className="flex-1 p-3 text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-amber-200 border-none bg-transparent"
                                />
                                <div className="bg-amber-50 px-3 py-1 border-t border-amber-100">
                                    <span className="text-[10px] text-amber-500">Preço especial - ignora tabela</span>
                                </div>
                            </div>
                        </div>

                        {/* Errors Panel */}
                        {xlsErrors.length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5 text-red-500" />
                                        <span className="text-sm font-bold text-red-700">{xlsErrors.length} códigos não encontrados na tabela:</span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCopyErrors}
                                        className="h-7 px-3 text-xs border-red-300 text-red-600 hover:bg-red-100"
                                    >
                                        <Copy className="h-3 w-3 mr-1" /> Copiar
                                    </Button>
                                </div>
                                <div className="bg-white rounded p-2 max-h-24 overflow-auto text-xs font-mono text-red-600">
                                    {xlsErrors.join(', ')}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between bg-slate-100 rounded-lg p-3 border border-slate-200">
                            <div className="text-xs text-slate-500">
                                <span className="font-bold">Dica:</span> Copie as colunas diretamente do Excel (Ctrl+C) e cole nos campos correspondentes (Ctrl+V)
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={handleXlsClear}
                                    className="h-9 px-4 text-xs font-bold uppercase border-slate-300"
                                >
                                    <X className="h-4 w-4 mr-2" /> Limpar Tudo
                                </Button>
                                <Button
                                    onClick={handleXlsImport}
                                    disabled={xlsImporting || xlsCodigos.trim().length === 0}
                                    className="h-9 px-6 text-xs font-bold uppercase bg-amber-500 hover:bg-amber-600"
                                >
                                    {xlsImporting ? (
                                        <>Importando...</>
                                    ) : (
                                        <><FileUp className="h-4 w-4 mr-2" /> Importar Itens</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* F5: Conferência */}
                    <div className={cn("absolute inset-0 flex flex-col overflow-hidden", activeTab !== 'F5' && "hidden")}>
                        {/* Grid Container */}
                        <div className="flex-1 overflow-auto border border-slate-300 rounded-lg shadow-sm bg-white">
                            <table className="w-full text-xs relative border-collapse">
                                <thead className="bg-slate-100 sticky top-0 z-10 font-semibold text-slate-700 h-9 shadow-sm">
                                    <tr>
                                        <th className="px-2 py-1 text-center border-b border-r border-slate-300 w-[40px]">Seq</th>
                                        <th className="px-2 py-1 text-left border-b border-r border-slate-300 w-[80px]">Código</th>
                                        <th className="px-2 py-1 text-left border-b border-r border-slate-300 w-[120px]">Complemento</th>
                                        <th className="px-2 py-1 text-left border-b border-r border-slate-300 min-w-[150px]">Descrição</th>
                                        <th className="px-2 py-1 text-center border-b border-r border-slate-300 w-[60px]">Quant</th>
                                        <th className="px-2 py-1 text-right border-b border-r border-slate-300 min-w-[110px]">Bruto</th>
                                        <th className="px-2 py-1 text-right border-b border-r border-slate-300 min-w-[110px]">Líquido</th>
                                        <th className="px-2 py-1 text-right border-b border-r border-slate-300 min-w-[110px]">Total</th>
                                        <th className="px-2 py-1 text-right border-b border-r border-slate-300 min-w-[110px]">Final</th>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                                            <th key={n} className="px-1 py-1 text-center font-semibold text-blue-600 border-b border-r border-slate-300 min-w-[60px]">{n}º</th>
                                        ))}
                                        <th className="px-1 py-1 text-center font-semibold text-amber-600 border-b border-r border-slate-300 min-w-[60px]">ADD %</th>
                                        <th className="px-1 py-1 text-center font-semibold text-slate-600 border-b border-r border-slate-300 min-w-[60px]">IPI %</th>
                                        <th className="px-1 py-1 text-center font-semibold text-slate-600 border-b border-r border-slate-300 min-w-[60px]">ST %</th>
                                        <th className="px-1 py-1 text-center border-b w-[30px]" title="Promocional">P</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {summaryItems.map((item, idx) => {
                                        // Busca info de embalagem do produto original
                                        const product = priceTable.products?.find(p => p.pro_codprod === item.ite_produto);
                                        const embalagem = product?.pro_embalagem || 0;
                                        const isPackagingError = embalagem > 1 && (item.ite_quant % embalagem !== 0);

                                        return (
                                            <tr
                                                key={idx}
                                                className={cn(
                                                    "border-b hover:bg-slate-50 transition-colors h-8 group",
                                                    item.ite_promocao === 'S' && "bg-orange-50 hover:bg-orange-100",
                                                    isPackagingError && "bg-red-50 hover:bg-red-100 ring-1 ring-inset ring-red-200"
                                                )}
                                            >
                                                <td className="px-2 py-0 text-center text-slate-500 border-r border-slate-300/50">{item.ite_seq || idx + 1}</td>
                                                <td className="px-2 py-0 font-medium border-r border-slate-300/50">{item.ite_produto}</td>
                                                <td className="px-1 py-0 border-r border-slate-300/50">
                                                    <input
                                                        type="text"
                                                        value={item.ite_embuch || ''}
                                                        onChange={(e) => handleGridEdit(idx, 'ite_embuch', e.target.value)}
                                                        className="w-full text-xs px-1 h-6 bg-transparent border-none focus:ring-1 focus:ring-blue-500 rounded" // Fundo transparente
                                                    />
                                                </td>
                                                <td className="px-2 py-0 truncate max-w-[150px] border-r border-slate-300/50" title={item.ite_nomeprod}>
                                                    {item.ite_nomeprod}
                                                </td>
                                                <td className="px-1 py-0 text-center relative border-r border-slate-300/50">
                                                    <input
                                                        type="text"
                                                        value={typeof item.ite_quant === 'number' ? item.ite_quant.toFixed(2) : (item.ite_quant ?? '')}
                                                        onChange={(e) => handleGridEdit(idx, 'ite_quant', e.target.value)}
                                                        className={cn(
                                                            "w-full text-center text-xs px-1 h-6 bg-transparent border-none focus:ring-1 focus:ring-blue-500 rounded font-semibold",
                                                            isPackagingError ? "text-red-600" : "text-slate-700"
                                                        )}
                                                    />
                                                    {isPackagingError && (
                                                        <div className="absolute right-1 top-1/2 -translate-y-1/2" title={`Quantidade deve ser múltiplo de ${embalagem}`}>
                                                            <AlertTriangle className="h-3 w-3 text-red-500" />
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-1 py-0 text-right border-r border-slate-300/50">
                                                    <input
                                                        type="text"
                                                        value={typeof item.ite_puni === 'number' ? item.ite_puni.toFixed(2) : (item.ite_puni ?? '')}
                                                        onChange={(e) => handleGridEdit(idx, 'ite_puni', e.target.value)}
                                                        onBlur={(e) => handleGridEdit(idx, 'ite_puni', parseFloat(e.target.value || 0).toFixed(2))}
                                                        className="w-full text-right text-xs px-1 h-6 bg-transparent border-none focus:ring-1 focus:ring-blue-500 rounded"
                                                    />
                                                </td>
                                                <td className="px-2 py-0 text-right font-medium text-slate-700 border-r border-slate-300/50">
                                                    {parseFloat(item.ite_puniliq || 0).toFixed(2)}
                                                </td>
                                                <td className="px-2 py-0 text-right text-slate-500 border-r border-slate-300/50">
                                                    {parseFloat(item.ite_totliquido || 0).toFixed(2)}
                                                </td>
                                                <td className="px-2 py-0 text-right font-bold text-slate-800 border-r border-slate-300/50">
                                                    {parseFloat(item.ite_valcomst || 0).toFixed(2)}
                                                </td>

                                                {/* Descontos 1-9 */}
                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                                                    <td key={n} className="px-0 py-0 text-center bg-blue-50/30 relative min-w-[60px] border-r border-slate-300/50">
                                                        <div className="flex items-center justify-center px-1">
                                                            <input
                                                                type="text"
                                                                value={typeof item[`ite_des${n}`] === 'number' ? item[`ite_des${n}`].toFixed(2) : (item[`ite_des${n}`] ?? '')}
                                                                onChange={(e) => handleGridEdit(idx, `ite_des${n}`, e.target.value)}
                                                                onBlur={(e) => handleGridEdit(idx, `ite_des${n}`, parseFloat(e.target.value || 0).toFixed(2))}
                                                                className="w-full text-right text-xs h-6 bg-transparent text-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-500 border-none p-0 pr-0.5"
                                                            />
                                                            <span className="text-xs text-blue-600/70 ml-0.5">%</span>
                                                        </div>
                                                    </td>
                                                ))}

                                                {/* ADD */}
                                                <td className="px-0 py-0 text-center bg-amber-50/30 relative min-w-[60px] border-r border-slate-300/50">
                                                    <div className="flex items-center justify-center px-1">
                                                        <input
                                                            type="text"
                                                            value={typeof item.ite_des10 === 'number' ? item.ite_des10.toFixed(2) : (item.ite_des10 ?? '')}
                                                            onChange={(e) => handleGridEdit(idx, 'ite_des10', e.target.value)}
                                                            onBlur={(e) => handleGridEdit(idx, 'ite_des10', parseFloat(e.target.value || 0).toFixed(2))}
                                                            className="w-full text-right text-xs h-6 bg-transparent text-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-500 border-none p-0 pr-0.5"
                                                        />
                                                        <span className="text-xs text-amber-600/70 ml-0.5">%</span>
                                                    </div>
                                                </td>

                                                {/* Read-only IPI/ST */}
                                                <td className="px-1 py-0 text-center text-xs text-slate-500 bg-slate-50/30 min-w-[60px] border-r border-slate-300/50">
                                                    {item.ite_ipi ? `${parseFloat(item.ite_ipi).toFixed(2)}%` : '-'}
                                                </td>
                                                <td className="px-1 py-0 text-center text-xs text-slate-500 bg-slate-50/30 min-w-[60px] border-r border-slate-300/50">
                                                    {item.ite_st ? `${parseFloat(item.ite_st).toFixed(2)}%` : '-'}
                                                </td>

                                                <td className="px-1 py-0 text-center">
                                                    {item.ite_promocao === 'S' && (
                                                        <span title="Item em Promoção">🟠</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="bg-slate-50 border-t border-slate-200 p-2 flex justify-center">
                            <div className="grid grid-cols-6 gap-2 w-full max-w-5xl">
                                {[
                                    { k: '1', l: 'Atualizar Valores', desc: 'Recarrega Preço/IPI/ST da tabela e Salva' },
                                    { k: '2', l: 'Desconto Padrão', desc: 'Aplica descontos do cabeçalho (respeita promoção)' },
                                    { k: '3', l: 'Desconto Grupo', desc: 'Calcula descontos por grupo de produto/cliente' },
                                    { k: '4', l: 'Atualizar Tabela', desc: 'Atualiza preços conforme tabela selecionada' },
                                    { k: '5', l: 'Atualizar IPI/ST', desc: 'Define IPI e ST fixos para todos os itens' },
                                    { k: '6', l: 'Voltar Preço Padrão', desc: 'Força preço bruto da tabela (remove manuais)' },
                                    { k: '7', l: 'Último Preço Pago', desc: 'Busca último preço praticado no histórico' },
                                    { k: '8', l: 'Forçar Descontos', desc: 'Aplica desc. cabeçalho em TUDO (ignora promoção)' },
                                    { k: '9', l: 'Inserir % Adicional', desc: 'Define % ADD e % ESP em lote' },
                                    { k: 'A', l: 'Checar Múltiplos', desc: 'Ajusta qtd para múltiplo da embalagem' },
                                    { k: 'B', l: 'Desc. por Quantidade', desc: '[Futuro] Desconto por quantidade' },
                                    { k: 'C', l: 'Código Original', desc: 'Preenche campo Embuch com Cód. Original' }
                                ].map((btn) => (
                                    <button
                                        key={btn.k}
                                        onClick={() => handleF5Action(btn.k)}
                                        className="flex items-center justify-start bg-white border border-slate-300 rounded shadow-sm px-2 py-1.5 h-10 hover:bg-emerald-50 hover:border-emerald-300 transition-all text-left w-full group overflow-hidden"
                                        title={`${btn.l}: ${btn.desc}`}
                                    >
                                        <span className="bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200 text-xs font-bold px-2 py-0.5 rounded mr-2 min-w-[24px] text-center border border-emerald-200 shrink-0">
                                            {btn.k}
                                        </span>
                                        <span className="text-xs font-semibold text-slate-700 truncate leading-tight group-hover:text-emerald-800">
                                            {btn.l}
                                        </span>
                                    </button>
                                ))}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowF5Help(true)}
                                className="h-10 w-10 text-slate-400 hover:text-emerald-600 shrink-0 ml-2"
                                title="Ajuda / Legenda dos Botões"
                            >
                                <HelpCircle className="h-6 w-6" />
                            </Button>
                        </div>
                    </div>

                    {/* Other Tabs */}
                    {['F4', 'F6', 'F7', '01'].map(tab => (
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
                            <Button
                                variant="outline"
                                onClick={onClose}
                                className="border-slate-300 text-slate-600 hover:bg-slate-50 font-bold h-10 px-6 uppercase tracking-wider transition-all duration-200"
                            >
                                <X className="h-4 w-4 mr-2" />
                                Cancelar (ESC)
                            </Button>
                        </>
                    ) : (
                        <Button
                            variant="outline"
                            onClick={() => setActiveTab('F1')}
                            className="mr-auto border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold h-10 px-6 uppercase tracking-wider transition-all duration-200 bg-white"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2 text-emerald-600" />
                            VOLTAR
                        </Button>
                    )}
                </div>
            </div>
            {/* Buyer Registration Dialog */}
            {/* Dialog de Atualização de IPI/ST (Botão 5) */}
            <Dialog open={showTaxDialog} onOpenChange={setShowTaxDialog}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Atualizar Impostos em Lote</DialogTitle>
                        <DialogDescription>
                            Informe os novos percentuais para aplicar em TODOS os itens.
                            Deixe em branco para manter o valor atual.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-ipi">Novo IPI (%)</Label>
                                <Input
                                    id="new-ipi"
                                    value={taxValues.ipi}
                                    onChange={(e) => setTaxValues({ ...taxValues, ipi: e.target.value })}
                                    placeholder="0,00"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-st">Novo ST (%)</Label>
                                <Input
                                    id="new-st"
                                    value={taxValues.st}
                                    onChange={(e) => setTaxValues({ ...taxValues, st: e.target.value })}
                                    placeholder="0,00"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowTaxDialog(false)}>Cancelar</Button>
                        <Button onClick={handleApplyTaxUpdate}>Aplicar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog de Atualização de Descontos (Botão 9) */}
            <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Descontos Adicionais em Lote</DialogTitle>
                        <DialogDescription>
                            Informe os percentuais para aplicar em TODOS os itens.
                            Deixe em branco para manter o valor atual.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="desc-add">% Add (ite_des10)</Label>
                                <Input
                                    id="desc-add"
                                    value={discountValues.add}
                                    onChange={(e) => setDiscountValues({ ...discountValues, add: e.target.value })}
                                    placeholder="0,00"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="desc-esp">% Especial (ESP)</Label>
                                <Input
                                    id="desc-esp"
                                    value={discountValues.esp}
                                    onChange={(e) => setDiscountValues({ ...discountValues, esp: e.target.value })}
                                    placeholder="0,00"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDiscountDialog(false)}>Cancelar</Button>
                        <Button onClick={handleApplyDiscountUpdate}>Aplicar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* F5 Help Dialog */}
            <Dialog open={showF5Help} onOpenChange={setShowF5Help}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Legenda de Funções (F5)</DialogTitle>
                        <DialogDescription>
                            Explicação detalhada de cada rotina de atualização em lote.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                        {[
                            { k: '1', t: 'Atualizar Valores', d: 'Recarrega Preço, IPI e ST da tabela de preços atual. Zera descontos se for item promocional. SALVA as alterações no banco.' },
                            { k: '2', t: 'Desconto Padrão', d: 'Aplica os descontos (1º ao 9º) definidos no cabeçalho do pedido. Respeita a flag de "Promoção" (não aplica se for Promo).' },
                            { k: '3', t: 'Desconto Grupo', d: 'Calcula descontos baseados em Grupos de Produtos e Clientes. Prioriza desconto por cliente, depois por tabela.' },
                            { k: '4', t: 'Atualizar Tabela', d: 'Atualiza o preço unitário (Bruto) conforme a tabela selecionada no pedido. Zera o desconto especial.' },
                            { k: '5', t: 'Atualizar IPI/ST', d: 'Abre um diálogo para definir uma alíquota fixa de IPI e/ou ST para TODOS os itens da lista.' },
                            { k: '6', t: 'Volta Padrão', d: 'Restaura o preço bruto original da tabela, ignorando quaisquer preços manuais digitados anteriormente.' },
                            { k: '7', t: 'Último Preço', d: 'Busca no histórico de pedidos deste cliente o último preço pago por cada produto e aplica no pedido atual.' },
                            { k: '8', t: 'Forçar Desconto', d: 'Ignora se o item é promocional ou não e aplica os descontos do cabeçalho em TODOS os itens.' },
                            { k: '9', t: 'Inserir % ADD', d: 'Permite definir o % de Desconto Adicional (ADD) e/ou Especial (ESP) para todos os itens de uma vez.' },
                            { k: 'A', t: 'Checar Múltiplos', d: 'Verifica a embalagem do produto. Se a quantidade não for múltiplo (ex: cx 12, pediu 13), ajusta para cima (ex: 24).' },
                            { k: 'B', t: 'Desconto Qtde', d: '[Futuro] Aplicará regras de desconto baseadas na quantidade comprada.' },
                            { k: 'C', t: 'Código Original', d: 'Pesquisa o produto na tabela original e preenche o campo "Embuch" com o código de fábrica.' },
                        ].map(item => (
                            <div key={item.k} className="flex gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                <div className="h-8 w-8 shrink-0 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 shadow-sm">
                                    {item.k}
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-800">{item.t}</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed mt-1">{item.d}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setShowF5Help(false)}>Entendi</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <BuyerRegistrationDialog
                open={showBuyerDialog}
                onOpenChange={setShowBuyerDialog}
                clientCode={formData.ped_cliente}
                buyerName={formData.ped_comprador}
                onSuccess={() => {
                    console.log('Comprador cadastrado com sucesso!');
                }}
            />

            {/* Condition Registration Dialog */}
            <ConditionRegistrationDialog
                open={showConditionDialog}
                onOpenChange={setShowConditionDialog}
                formData={formData}
                selectedIndustry={selectedIndustry}
                clientName={(auxData.clients || []).find(c => String(c.cli_codigo) === String(formData.ped_cliente))?.cli_nomred}
            />
        </div >
    );
};

export default OrderForm;

