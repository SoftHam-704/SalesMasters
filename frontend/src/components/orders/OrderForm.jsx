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
    Check, X, Plus, UserPlus, Search, Filter, AlertTriangle, ArrowLeft, ArrowRight,
    Calculator, Save, Trash2, Calendar, ShoppingCart, Truck, CreditCard,
    FileText, User, MapPin, MoreHorizontal, FileUp, Copy,
    RefreshCw, Tag, DollarSign, Eraser, Star, StarOff, Percent, HelpCircle, CheckSquare,
    FileJson, FileCode, LayoutDashboard, Loader2, Package, ChevronsUpDown, Edit2, ClipboardCheck, FileCheck, MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SmartOrderDialog } from './SmartOrderDialog';
import OrderItemEntry from './OrderItemEntry';
import { NODE_API_URL, getApiUrl } from '../../utils/apiConfig';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    CommandList,
} from "@/components/ui/command";
import DbComboBox from '@/components/DbComboBox';
import InputField from '@/components/InputField';
import { auxDataService } from '@/services/orders/auxDataService';

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

    // Fetchers for DbComboBox
    const fetchClients = async (search) => {
        const res = await auxDataService.getClients('A', search);
        return (res.data || []).map(c => ({
            label: c.cli_nomred || c.cli_nome,
            value: c.cli_codigo,
            nomred: c.cli_nomred,
            nome: c.cli_nome,
            cnpj: c.cli_cnpj,
            cidade: c.cli_cidade,
            uf: c.cli_uf,
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
    const [userParams, setUserParams] = useState({ par_qtdenter: 4 }); // Default to careful

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
    const [importedItems, setImportedItems] = useState([]); // Itens vindos da Sugestão Inteligente Master
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

    // Load user parameters on mount
    useEffect(() => {
        const loadUserParams = async () => {
            const userStr = sessionStorage.getItem('user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    if (user && user.id) {
                        const response = await fetch(getApiUrl(NODE_API_URL, `/api/parametros/${user.id}`));
                        const data = await response.json();
                        if (data.success && data.data) {
                            setUserParams(data.data);
                        }
                    }
                } catch (e) {
                    console.error('Erro ao carregar parâmetros do usuário:', e);
                }
            }
        };
        loadUserParams();
    }, []);

    // Load existing order or initialize new one with parameters
    useEffect(() => {
        const initializeForm = async () => {
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
                if (userParams) {
                    // SE FOR PEDIDO NOVO, aplicamos os parâmetros carregados
                    if (importedItemsRef.current.length === 0) {
                        setFormData({
                            ...initialFormState,
                            ped_industria: selectedIndustry?.for_codigo || '',
                            // Aplica parâmetros do usuário
                            ped_frete: userParams.par_tipofretepadrao || 'C',
                            ped_situacao: userParams.par_iniciapedido || 'P',
                            ped_obs: userParams.par_obs_padrao || '',
                        });

                        if (userParams.par_itemduplicado === 'S') {
                            setAllowDuplicates(true);
                        }

                        setSummaryItems([]);
                        setDisplayNumber('(Novo)');
                        loadNextNumber();
                    }
                }
            }
        };

        initializeForm();
    }, [existingOrder, selectedIndustry, userParams]);

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

    // Load items when F1 or F5 tab becomes active OR when importedItems changes (Sugestão)
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

    // Recalcular totais do pedido com lógica robusta (calculando impostos on-the-fly se necessário)
    useEffect(() => {
        if (summaryItems.length > 0) {
            const totals = summaryItems.reduce((acc, item) => {
                const totBruto = parseFloat(item.ite_totbruto) || 0;
                const totLiq = parseFloat(item.ite_totliquido) || 0;

                // Recalcula impostos baseado nas alíquotas para garantir precisão
                // (mesmo que o campo ite_valcomipi venha zerado do backend)
                const ipiRate = parseFloat(item.ite_ipi) || 0;
                const stRate = parseFloat(item.ite_st) || 0;

                const valComIpi = totLiq * (1 + ipiRate / 100);
                const valComSt = valComIpi * (1 + stRate / 100); // Base de ST é o valor com IPI

                return {
                    bruto: acc.bruto + totBruto,
                    liq: acc.liq + totLiq,
                    ipi: acc.ipi + (valComIpi - totLiq),
                    comImpostos: acc.comImpostos + valComSt
                };
            }, { bruto: 0, liq: 0, ipi: 0, comImpostos: 0 });

            // Evitar loops infinitos: só atualiza se os valores realmente mudaram
            if (
                Math.abs((formData.ped_totbruto || 0) - totals.bruto) > 0.01 ||
                Math.abs((formData.ped_totliq || 0) - totals.liq) > 0.01 ||
                Math.abs((formData.ped_totalipi || 0) - totals.ipi) > 0.01 ||
                Math.abs((formData.ped_totalcomimpostos || 0) - totals.comImpostos) > 0.01
            ) {
                setFormData(prev => ({
                    ...prev,
                    ped_totbruto: totals.bruto,
                    ped_totliq: totals.liq,
                    ped_totalipi: totals.ipi,
                    ped_totalcomimpostos: totals.comImpostos
                }));
            }
        } else if ((formData.ped_totbruto || 0) > 0 || (formData.ped_totliq || 0) > 0) {
            // Se zerou a grid, zerar totais
            setFormData(prev => ({
                ...prev,
                ped_totbruto: 0,
                ped_totliq: 0,
                ped_totalipi: 0,
                ped_totalcomimpostos: 0
            }));
        }
    }, [summaryItems, formData.ped_totbruto, formData.ped_totliq, formData.ped_totalipi, formData.ped_totalcomimpostos]);


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
                // SYNC IMPORTED ITEMS (SMART)
                // ---------------------------------------------------------
                if (importedItems.length > 0) {
                    console.log("💾 [handleSave] Sincronizando itens sugeridos...", importedItems.length);
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

    // Reusable handler for Smart Order suggestions (IA)
    const handleSmartImportItems = async (items) => {
        // 1. Ensure Order is Saved before importing items
        let currentOrderId = formData.ped_pedido;
        if (!currentOrderId || currentOrderId === '(Novo)') {
            toast.info("Salvando pedido antes de processar sugestão de itens...");
            const savedData = await handleSave({ silent: true });
            if (savedData?.ped_pedido) {
                currentOrderId = savedData.ped_pedido;
            } else {
                console.error("❌ Failed to save order. Aborting import.");
                toast.error("Erro ao salvar o cabeçalho do pedido.");
                return false;
            }
        }

        try {
            // 2. Verify price table
            if (!formData.ped_tabela) {
                toast.error("Selecione uma tabela de preço antes de importar.");
                return false;
            }

            const products = priceTable?.memtable || [];
            const finalImportItems = [];
            const notFoundInTable = [];

            // Get existing items count to assign correct sequence
            const existingItemsRes = await fetch(`/api/orders/${currentOrderId}/items`);
            const existingItemsResponse = existingItemsRes.ok ? await existingItemsRes.json() : {};
            const existingItems = existingItemsResponse.success ? existingItemsResponse.data : [];

            let nextSeq = existingItems.length > 0
                ? Math.max(...existingItems.map(i => i.ite_seq || 0)) + 1
                : 1;

            for (const item of items) {
                const product = products.find(p =>
                    String(p.pro_codprod) === String(item.codigo || item.codigo_produto) ||
                    String(p.pro_codigonormalizado) === String(item.codigo || item.codigo_produto)
                );

                if (!product) {
                    notFoundInTable.push(item.codigo || item.codigo_produto || '?');
                    continue;
                }

                const newItem = {
                    ite_seq: nextSeq++,
                    ite_industria: selectedIndustry?.for_codigo,
                    ite_produto: product.pro_codprod,
                    ite_idproduto: product.pro_id,
                    ite_embuch: '',
                    ite_nomeprod: product.pro_nome,
                    ite_quant: parseFloat(item.quantidade || item.quant) || 1,
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
                toast.warning(`${notFoundInTable.length} itens não encontrados na tabela de preços (Verifique os códigos).`);
            }

            if (finalImportItems.length === 0) {
                toast.error("Nenhum item pôde ser importado. Os códigos do arquivo não batem com a tabela de preços.");
                return false;
            }

            // Sync IN MEMORY and then navigate
            const allMemItems = [...existingItems, ...finalImportItems];
            setImportedItems(allMemItems);
            setSummaryItems(allMemItems);

            toast.success(`✨ ${finalImportItems.length} itens carregados para conferência!`);

            setTimeout(() => {
                setActiveTab('F5');
            }, 500);

            return true;
        } catch (error) {
            console.error('❌ [Smart Import] Error:', error);
            toast.error('Erro ao processar importação: ' + error.message);
            return false;
        }
    };

    // Handle tab change
    const handleTabChange = async (tab) => {
        // Abas que manipulam itens (F2=Sugestão, F3=Itens, F5=Conferência, XX=Import XLS) 
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
                    const product = priceTable.memtable?.find(p => p.pro_codprod === newItem.ite_produto);

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
                // O hook usePriceTable já atualiza priceTable.memtable quando formData.ped_tabela muda
                const product = priceTable.memtable?.find(p => p.pro_codprod === newItem.ite_produto);

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
                const product = priceTable.memtable?.find(p => p.pro_codprod === newItem.ite_produto);

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


    const inputClasses = "h-10 text-sm font-semibold border-slate-400 focus:border-emerald-500 focus:ring-emerald-500 bg-slate-50/50 hover:bg-white transition-all rounded-xl shadow-sm text-slate-700 placeholder:text-slate-300";
    const labelClasses = "text-[11px] text-slate-700 font-bold uppercase tracking-wider mb-1.5 block ml-1";

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white/95 backdrop-blur-xl w-full max-w-[1400px] h-[95vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/20 luxury-shadow select-none relative mesh-gradient">
                {/* Decorative border top gradient */}
                <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-blue-500 to-emerald-500 shrink-0" />

                <div className="bg-white/40 backdrop-blur-md border-b border-white/20 px-6 py-5 flex items-center justify-between shrink-0 z-50 glass-premium">
                    <div className="flex items-center gap-5">
                        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 text-white transform hover:scale-110 transition-transform duration-300 cursor-help animate-float premium-shine">
                            <ShoppingCart className="h-6 w-6" strokeWidth={2.5} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                                    PEDIDO DE VENDA
                                    <span className="text-slate-300 font-light prose">/</span>
                                </h1>
                                <span className="bg-emerald-500 text-white px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                                    {selectedIndustry?.for_nomered || 'Indústria'}
                                </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-bold flex items-center gap-4 mt-1">
                                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100/50"><FileText className="h-3.5 w-3.5 text-blue-500" /> NÚMERO: <b className="text-slate-800 font-black">{displayNumber}</b></span>
                                {formData.ped_data && (
                                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100/50"><Calendar className="h-3.5 w-3.5 text-purple-500" /> EMISSÃO: <b className="text-slate-800 font-black">{new Date(formData.ped_data).toLocaleDateString()}</b></span>
                                )}
                                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100/50">
                                    <div className={cn(
                                        "h-2 w-2 rounded-full",
                                        formData.ped_situacao === 'F' ? "bg-blue-500" : "bg-emerald-500 animate-pulse"
                                    )} />
                                    STATUS: <b className="text-slate-800 font-black uppercase">{formData.ped_situacao === 'F' ? 'FATURADO' : 'PENDENTE'}</b>
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Total Bruto */}
                        <div className="flex flex-col items-end bg-emerald-50/30 px-4 py-1.5 rounded-2xl border border-emerald-100/50 shadow-sm relative overflow-hidden group">
                            <div className="absolute inset-0 bg-emerald-100/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                            <span className="text-[10px] text-emerald-600/80 font-bold uppercase tracking-widest relative z-10">Total Bruto</span>
                            <span className="text-xl font-mono font-bold text-emerald-700 tracking-tighter leading-none relative z-10">{formatCurrency(formData.ped_totbruto)}</span>
                        </div>

                        {/* Valor Líquido (Main) */}
                        <div className="flex flex-col items-end bg-emerald-50 px-4 py-1.5 rounded-2xl border border-emerald-100 shadow-inner relative overflow-hidden">
                            <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Valor Líquido</span>
                            <span className="text-2xl font-mono font-black text-emerald-600 tracking-tighter leading-none glow-sm">{formatCurrency(formData.ped_totliq)}</span>
                        </div>

                        {/* Total c/ Impostos */}
                        <div className="flex flex-col items-end bg-emerald-50/30 px-4 py-1.5 rounded-2xl border border-emerald-100/50 shadow-sm relative overflow-hidden group">
                            <div className="absolute inset-0 bg-emerald-100/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                            <span className="text-[10px] text-emerald-600/80 font-bold uppercase tracking-widest relative z-10">Total c/ Imp.</span>
                            <span className="text-xl font-mono font-bold text-emerald-700 tracking-tighter leading-none relative z-10">{formatCurrency(formData.ped_totalcomimpostos)}</span>
                        </div>
                    </div>
                </div>


                <div className="flex-1 relative overflow-hidden bg-slate-50/30">

                    {/* F1: Capa (Principal) */}
                    <div className={cn("absolute inset-0 flex flex-col p-4 gap-4 overflow-auto animate-in slide-in-from-left duration-300", activeTab !== 'F1' && "hidden")}>

                        {/* Top Section: Form Fields */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm shrink-0">
                            <div className="grid grid-cols-12 gap-6">

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
                                        <DbComboBox
                                            label="Cliente (F8-Pesquisar)"
                                            placeholder="Busque por nome, CNPJ ou código..."
                                            value={formData.ped_cliente}
                                            initialLabel={existingOrder?.cli_nomred || existingOrder?.cli_nome || formData.ped_cliente}
                                            fetchData={fetchClients}
                                            onChange={async (val, client) => {
                                                handleFieldChange('ped_cliente', val);
                                                if (!val) return;

                                                // Buscar condições CLI_IND apenas em modo INSERT
                                                if (!existingOrder && selectedIndustry?.for_codigo) {
                                                    try {
                                                        const conditions = await cliIndData.fetchConditions(
                                                            val,
                                                            selectedIndustry.for_codigo
                                                        );

                                                        if (conditions) {
                                                            applyCliIndConditions(conditions);

                                                            // FALLBACK: Se comprador estiver vazio, buscar em CLI_ANIV
                                                            if (!conditions.cli_comprador) {
                                                                try {
                                                                    const buyer = await cliAnivData.fetchBuyer(val);
                                                                    if (buyer) {
                                                                        handleFieldChange('ped_comprador', buyer.nome);
                                                                    }
                                                                } catch (error) {
                                                                    console.error('Erro ao buscar comprador em CLI_ANIV:', error);
                                                                }
                                                            }
                                                        } else {
                                                            try {
                                                                const buyer = await cliAnivData.fetchBuyer(val);
                                                                if (buyer) {
                                                                    handleFieldChange('ped_comprador', buyer.nome);
                                                                }
                                                            } catch (error) {
                                                                console.error('Erro ao buscar comprador em CLI_ANIV:', error);
                                                            }
                                                        }
                                                    } catch (error) {
                                                        console.error('Erro ao buscar CLI_IND:', error);
                                                    }
                                                }
                                            }}
                                            renderItem={(item) => (
                                                <div className="flex items-center gap-3 w-full">
                                                    <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0">
                                                        {(item.nomred || item.nome || "?").charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col flex-1 overflow-hidden">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="font-bold text-slate-700 truncate text-[11px]">{item.nomred || item.nome}</span>
                                                            <span className="text-[9px] text-teal-600 font-mono font-bold bg-teal-50 px-1 rounded">ID: {item.value}</span>
                                                        </div>
                                                        <span className="text-[10px] text-slate-500 truncate">{item.nome}</span>
                                                        <div className="flex items-center gap-2 text-[9px] text-slate-400">
                                                            <span>{item.cnpj || 'Sem CNPJ'}</span>
                                                            <span className="truncate">• {item.cidade}/{item.uf}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        />
                                    </div>

                                    {/* Row 3: Transporter */}
                                    <div className="flex flex-col gap-1.5">
                                        <DbComboBox
                                            label="Transportadora"
                                            placeholder="Selecione a transportadora..."
                                            value={formData.ped_transp}
                                            initialLabel={existingOrder?.tra_nome || formData.ped_transp}
                                            fetchData={fetchCarriers}
                                            onChange={(val) => handleFieldChange('ped_transp', val)}
                                        />
                                    </div>

                                    {/* Unified Organized Grid for Footer Fields - Modern Floating Label Style */}
                                    <div className="grid grid-cols-12 gap-x-4 gap-y-1 mt-1">
                                        <div className="col-span-6">
                                            <DbComboBox
                                                label="VENDEDOR"
                                                placeholder="Selecione o vendedor..."
                                                value={formData.ped_vendedor}
                                                initialLabel={existingOrder?.ven_nome || formData.ped_vendedor}
                                                fetchData={fetchSellers}
                                                onChange={(val) => handleFieldChange('ped_vendedor', val)}
                                            />
                                        </div>

                                        <div className="col-span-6">
                                            <InputField
                                                label="CONDIÇÕES"
                                                value={formData.ped_conpgto || ''}
                                                onChange={(e) => handleFieldChange('ped_conpgto', e.target.value)}
                                                placeholder=" "
                                            />
                                        </div>

                                        <div className="col-span-5">
                                            <InputField
                                                label="COMPRADOR"
                                                value={formData.ped_comprador || ''}
                                                onChange={(e) => handleFieldChange('ped_comprador', e.target.value)}
                                                placeholder=" "
                                            />
                                        </div>

                                        <div className="col-span-1 flex items-start pt-[1px]">
                                            <Button
                                                className="h-[50px] w-full btn-god-emerald active:scale-95 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center transition-all group border-none"
                                                onClick={() => setShowBuyerDialog(true)}
                                                type="button"
                                                title="Cadastrar comprador"
                                            >
                                                <Plus className="h-6 w-6 text-white stroke-[3.5px]" />
                                            </Button>
                                        </div>

                                        <div className="col-span-6">
                                            <DbComboBox
                                                label="FRETE"
                                                value={formData.ped_frete}
                                                initialLabel={formData.ped_frete === 'F' ? 'FOB' : (formData.ped_frete === 'C' ? 'CIF' : '')}
                                                fetchData={async (search) => {
                                                    const options = [
                                                        { label: 'CIF', value: 'C' },
                                                        { label: 'FOB', value: 'F' }
                                                    ];
                                                    return options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
                                                }}
                                                onChange={(val) => handleFieldChange('ped_frete', val)}
                                            />
                                        </div>

                                        <div className="col-span-6">
                                            <InputField
                                                label="PEDIDO CLIENTE"
                                                value={formData.ped_pedcli || ''}
                                                onChange={(e) => handleFieldChange('ped_pedcli', e.target.value)}
                                                placeholder=" "
                                            />
                                        </div>

                                        <div className="col-span-6">
                                            <InputField
                                                label="PEDIDO INDÚSTRIA"
                                                value={formData.ped_pedindu || ''}
                                                onChange={(e) => handleFieldChange('ped_pedindu', e.target.value)}
                                                placeholder=" "
                                            />
                                        </div>
                                    </div>


                                </div>

                                {/* Right Column: Financials */}
                                <div className="col-span-12 lg:col-span-4 flex flex-col gap-3 border-l border-dashed border-emerald-200 pl-3">
                                    <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100 shadow-sm">
                                        <DbComboBox
                                            label="TABELA DE PREÇO"
                                            placeholder="Selecione a tabela..."
                                            value={formData.ped_tabela}
                                            initialLabel={existingOrder?.tab_descricao || formData.ped_tabela}
                                            fetchData={fetchPriceTables}
                                            onChange={(val) => handleFieldChange('ped_tabela', val)}
                                            className="bg-white border-amber-200 text-amber-900 font-bold"
                                        />
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
                                    <div className="border border-blue-400 rounded-lg p-3 bg-white mb-3 shadow-sm">
                                        <div className="grid grid-cols-4 gap-2 mb-3">
                                            {[
                                                { key: 'ped_pri', label: '1º' }, { key: 'ped_seg', label: '2º' }, { key: 'ped_ter', label: '3º' },
                                                { key: 'ped_qua', label: '4º' }
                                            ].map((field) => (
                                                <DiscountInput
                                                    key={field.key}
                                                    label={field.label}
                                                    value={formData[field.key]}
                                                    onChange={(val) => handleFieldChange(field.key, val)}
                                                />
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-5 gap-2 items-center">
                                            {[
                                                { key: 'ped_qui', label: '5º' }, { key: 'ped_sex', label: '6º' }, { key: 'ped_set', label: '7º' },
                                                { key: 'ped_oit', label: '8º' }, { key: 'ped_nov', label: '9º' }
                                            ].map((field) => (
                                                <DiscountInput
                                                    key={field.key}
                                                    label={field.label}
                                                    value={formData[field.key]}
                                                    onChange={(val) => handleFieldChange(field.key, val)}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <Button
                                        className="h-10 w-full btn-god-emerald active:scale-95 rounded-xl text-xs mb-3 shadow-lg shadow-emerald-500/20"
                                        title="Salvar dados como padrão do cliente"
                                        onClick={() => {
                                            setShowConditionDialog(true);
                                        }}
                                        type="button"
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <Star className="h-4 w-4 text-white" />
                                            <span className="font-black tracking-widest">TORNAR PADRÃO</span>
                                        </div>
                                    </Button>


                                    <div className="flex items-center space-x-3 my-4 p-2 rounded-xl bg-red-50/30 border border-red-100/50 w-fit group">
                                        <Checkbox
                                            id="allowDuplicates"
                                            checked={allowDuplicates}
                                            onCheckedChange={(checked) => {
                                                console.log("Checkbox toggled:", checked);
                                                setAllowDuplicates(checked);
                                                handleFieldChange('ped_permiterepe', checked);
                                            }}
                                            className="h-6 w-6 border-2 border-red-400 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600 transition-all cursor-pointer shadow-sm shadow-red-500/10"
                                        />
                                        <label
                                            htmlFor="allowDuplicates"
                                            className="text-lg font-bold cursor-pointer transition-all group-hover:translate-x-1"
                                            style={{
                                                color: '#FF0000',
                                                fontFamily: "'Courier New', Courier, monospace",
                                                letterSpacing: '-0.02em'
                                            }}
                                        >
                                            Permitir ítens repetidos?
                                        </label>
                                    </div>


                                </div>
                            </div>
                        </div>

                        {/* Navigation Action Buttons - 2025 Modern Design Unified */}
                        <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/40 backdrop-blur-md rounded-2xl border border-slate-300/40 shadow-inner w-full mt-2 mb-1.5 overflow-x-auto no-scrollbar">
                            {[
                                { key: 'F1', label: 'F1 - Principal', icon: LayoutDashboard },
                                { key: 'F2', label: 'F2 - Inteligência', isIntelligence: true },
                                { key: 'F3', label: 'F3 - Itens', icon: ShoppingCart },
                                { key: 'F4', label: 'F4 - Faturas', icon: CreditCard },
                                { key: 'F5', label: 'F5 - Conferência', icon: ClipboardCheck },
                                { key: 'F6', label: 'F6 - Obs.', icon: MessageSquare },
                                { key: 'F7', label: 'F7 - Faturados', icon: FileCheck },
                                { key: 'XX', label: 'XX - Imp. XLS', icon: FileUp },
                                { key: '01', label: '01 - LOAD XML', icon: FileCode },
                            ].map(tab => {
                                if (tab.isIntelligence) {
                                    return (
                                        <div key={tab.key} className="mx-0.5">
                                            <SmartOrderDialog
                                                disabled={false}
                                                orderId={formData.ped_pedido}
                                                orderNumber={displayNumber}
                                                onOrderGenerated={handleSmartImportItems}
                                            />
                                        </div>
                                    );
                                }

                                const Icon = tab.icon;
                                const isActive = activeTab === tab.key;

                                return (
                                    <button
                                        key={tab.key}
                                        onClick={() => handleTabChange(tab.key)}
                                        className={cn(
                                            "group relative flex-1 min-w-[110px] flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-all duration-500 h-[42px]",
                                            "text-[10px] font-black uppercase tracking-widest whitespace-nowrap",
                                            isActive
                                                ? "active-tab-glow text-blue-700 font-black shadow-xl scale-[1.05] z-20"
                                                : "bg-white border border-blue-200/60 text-slate-700 shadow-sm hover:border-blue-400 hover:text-blue-900 hover:scale-[1.02] z-10"
                                        )}
                                    >
                                        <Icon className={cn(
                                            "h-4 w-4 transition-all duration-500",
                                            isActive
                                                ? "text-blue-600 scale-125 rotate-[360deg]"
                                                : "text-blue-400/70 group-hover:text-blue-500 group-hover:rotate-12"
                                        )} />
                                        <span>{tab.label}</span>
                                        {isActive && (
                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-500 rounded-full blur-[1.5px] animate-pulse" />
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
                                            <th className="p-1.5 border-b text-left whitespace-nowrap">Seq</th>
                                            <th className="p-1.5 border-b text-left whitespace-nowrap">Código</th>
                                            <th className="p-1.5 border-b text-left whitespace-nowrap">Complem.</th>
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
                                            summaryItems.slice().sort((a, b) => (b.ite_seq || 0) - (a.ite_seq || 0)).map((item, idx) => (
                                                <tr key={idx} className="hover:bg-emerald-50/50 border-b border-slate-100 transition-colors text-[10px] divide-x divide-slate-50">
                                                    <td className="p-1.5 text-center text-slate-500 font-bold whitespace-nowrap">{String(item.ite_seq || (summaryItems.length - idx)).padStart(3, '0')}</td>
                                                    <td className="p-1.5 font-bold text-blue-600 whitespace-nowrap">{item.ite_produto}</td>
                                                    <td className="p-1.5 text-slate-500 whitespace-nowrap">{item.ite_embuch}</td>
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
                            userParams={userParams}
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
                                        const product = priceTable.memtable?.find(p => p.pro_codprod === item.ite_produto);
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
                    {/* F6: Observações */}
                    <div className={cn("absolute inset-0 flex flex-col p-4 overflow-hidden", activeTab !== 'F6' && "hidden")}>
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col h-full relative overflow-hidden">
                            {/* Decorative Background Icon */}
                            <MessageSquare className="absolute -bottom-10 -right-10 w-96 h-96 text-slate-50 opacity-50 pointer-events-none" />

                            <div className="flex items-center gap-3 mb-4 z-10">
                                <div className="p-2 bg-emerald-100 rounded-xl">
                                    <MessageSquare className="h-6 w-6 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Observações do Pedido</h3>
                                    <p className="text-xs text-slate-500">Informações adicionais para a nota fiscal ou separação.</p>
                                </div>
                            </div>

                            <div className="flex-1 z-10">
                                <textarea
                                    value={formData.ped_obs || ''}
                                    onChange={(e) => handleFieldChange('ped_obs', e.target.value)}
                                    className={cn(
                                        "w-full h-full rounded-xl border border-slate-200 bg-slate-50/50 p-6 text-sm",
                                        "focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none focus:bg-white transition-all",
                                        "shadow-inner resize-none text-slate-700 font-medium leading-relaxed",
                                        "placeholder:text-slate-400 placeholder:italic"
                                    )}
                                    placeholder="Digite aqui as observações detalhadas do pedido..."
                                />
                            </div>

                            <div className="mt-4 flex justify-end z-10">
                                <span className="text-xs font-medium text-slate-400">
                                    {(formData.ped_obs || '').length} caracteres
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Other Tabs */}
                    {['F4', 'F7', '01'].map(tab => (
                        <div key={tab} className={cn("absolute inset-0 flex items-center justify-center", activeTab !== tab && "hidden")}>
                            <div className="text-center text-emerald-300">
                                <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-medium">Aba {tab}</p>
                                <p className="text-sm mt-2">Em desenvolvimento...</p>
                            </div>
                        </div>
                    ))}

                </div> {/* End of Main Content */}

                {/* --- MODERN FOOTER --- */}
                <div className="bg-white border-t border-slate-200 px-8 py-4 flex items-center justify-between shrink-0 glass-premium z-50">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Itens no Pedido</span>
                            <span className="text-sm font-bold text-slate-700">{summaryItems.length} produtos</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {activeTab === 'F1' ? (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                    className="btn-god-cancel h-12 px-8 rounded-2xl text-[13px] tracking-wide"
                                >
                                    <X className="h-5 w-5 mr-2" />
                                    CANCELAR
                                </Button>

                                <Button
                                    onClick={handleSave}
                                    disabled={loading || isSaving}
                                    className="btn-god-save h-12 px-12 rounded-2xl text-[14px] font-black tracking-widest min-w-[220px]"
                                >
                                    {loading || isSaving ? (
                                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                    ) : (
                                        <Save className="h-5 w-5 mr-2 text-emerald-200" />
                                    )}
                                    {isSaving ? 'SALVANDO...' : 'SALVAR (F10)'}
                                </Button>
                            </>
                        ) : (
                            <Button
                                onClick={() => setActiveTab('F1')}
                                className="bg-slate-800 hover:bg-slate-900 text-white h-12 px-12 rounded-2xl text-[14px] font-black tracking-widest min-w-[220px] shadow-xl hover:scale-105 transition-all"
                            >
                                <ArrowLeft className="h-5 w-5 mr-2" />
                                VOLTAR PARA O PRINCIPAL
                            </Button>
                        )}
                    </div>
                </div>
            </div >
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

